/**
 * Cloudinary image upload service (client-side, unsigned upload preset).
 *
 * IMPORTANT SECURITY NOTE
 * -----------------------
 * Only the Cloud Name and the Upload Preset are exposed to the browser.
 * The Cloudinary API Secret MUST NEVER be imported or referenced from
 * client code. Uploads are performed using an unsigned upload preset
 * configured in the Cloudinary dashboard (Settings → Upload → Upload
 * presets → Signing mode = "Unsigned"). This is the officially supported
 * way to upload directly from a browser without leaking secrets.
 *
 * Both `cloudName` and `uploadPreset` are public identifiers — they are
 * designed to be embedded in client applications.
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
}

export interface CloudinaryUploadResult {
  /** The secure HTTPS URL that should be stored in the product record. */
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface CloudinaryUploadOptions {
  /** Folder override; falls back to the configured folder. */
  folder?: string;
  /** Optional public id override. */
  publicId?: string;
  /** Per-file tags applied to the upload. */
  tags?: string[];
  /** Abort signal for cancellation / timeout. */
  signal?: AbortSignal;
  /** Progress callback (0–100). */
  onProgress?: (percent: number) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * Read Cloudinary configuration from Vite env vars.
 * Returns null when Cloudinary is not configured so callers can hide
 * the option instead of crashing — this keeps the feature fully additive.
 */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER?.trim() || undefined;

  if (!cloudName || !uploadPreset) {
    return null;
  }
  if (
    cloudName === 'your-cloud-name' ||
    cloudName === 'your-cloudinary-cloud-name'
  ) {
    return null;
  }
  if (
    uploadPreset === 'your-upload-preset' ||
    uploadPreset === 'your-cloudinary-upload-preset'
  ) {
    return null;
  }

  return { cloudName, uploadPreset, folder };
}

/**
 * Validate a file before uploading. Throws a descriptive Error on failure.
 */
export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('No file selected.');
  }

  if (file.size === 0) {
    throw new Error('The selected file is empty.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);
  if (!mimeOk && !extOk) {
    throw new Error(
      'Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, AVIF.'
    );
  }
}

/**
 * Upload an image file to Cloudinary using XHR (for progress events) and an
 * unsigned upload preset. Returns the secure_url to be stored on the product.
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  validateImageFile(file);

  const folder = options.folder ?? config.folder;
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
    config.cloudName
  )}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  if (folder) formData.append('folder', folder);
  if (options.publicId) formData.append('public_id', options.publicId);
  if (options.tags?.length) formData.append('tags', options.tags.join(','));

  // Combine external signal with internal timeout signal.
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(
    () => timeoutController.abort(new Error('Upload timed out after 60 seconds.')),
    UPLOAD_TIMEOUT_MS
  );

  const onAbort = () => timeoutController.abort(options.signal?.reason);
  if (options.signal) {
    if (options.signal.aborted) {
      window.clearTimeout(timeoutId);
      throw new Error('Upload cancelled.');
    }
    options.signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const result = await postFormDataWithProgress({
      url: endpoint,
      formData,
      signal: timeoutController.signal,
      onProgress: options.onProgress,
    });

    if (!result.secure_url) {
      throw new Error(
        'Cloudinary returned a successful response but no secure_url.'
      );
    }

    return {
      secureUrl: result.secure_url as string,
      publicId: (result.public_id as string) ?? '',
      width: typeof result.width === 'number' ? result.width : undefined,
      height: typeof result.height === 'number' ? result.height : undefined,
      format: typeof result.format === 'string' ? result.format : undefined,
      bytes: typeof result.bytes === 'number' ? result.bytes : undefined,
    };
  } catch (err) {
    throw normalizeCloudinaryError(err);
  } finally {
    window.clearTimeout(timeoutId);
    if (options.signal) options.signal.removeEventListener('abort', onAbort);
  }
}

interface PostFormDataArgs {
  url: string;
  formData: FormData;
  signal: AbortSignal;
  onProgress?: (percent: number) => void;
}

function postFormDataWithProgress({
  url,
  formData,
  signal,
  onProgress,
}: PostFormDataArgs): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const pct = Math.round((event.loaded / event.total) * 100);
      onProgress?.(Math.min(100, Math.max(0, pct)));
    };

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        // ignore — handled by status check below
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((body as Record<string, unknown>) ?? {});
      } else {
        const message =
          (body as { error?: { message?: string } } | null)?.error?.message ||
          `Upload failed with HTTP ${xhr.status}.`;
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.onabort = () =>
      reject(new Error(signal.reason instanceof Error ? signal.reason.message : 'Upload cancelled.'));

    signal.addEventListener('abort', () => xhr.abort(), { once: true });

    xhr.send(formData);
  });
}

function normalizeCloudinaryError(err: unknown): Error {
  if (err instanceof Error) {
    if (err.name === 'AbortError' || /aborted|cancelled|timed out/i.test(err.message)) {
      return new Error(
        err.message.includes('timed out')
          ? 'Upload timed out. Please try again with a smaller file or a faster connection.'
          : 'Upload cancelled.'
      );
    }
    return err;
  }
  return new Error('Upload failed for an unknown reason.');
}

/**
 * Heuristic to detect whether a URL is a Cloudinary-hosted asset.
 * Used by the rendering layer if it ever needs to special-case Cloudinary
 * (e.g. for srcset hints); harmless when Cloudinary is absent.
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'res.cloudinary.com' || host.endsWith('.res.cloudinary.com');
  } catch {
    return false;
  }
}