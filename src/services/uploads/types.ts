/**
 * Provider-agnostic upload types.
 *
 * The existing admin flow (URL textbox, considered the "Appwrite (Existing)"
 * branch) is intentionally NOT modeled here — it remains a plain <Input>.
 * The new Cloudinary uploader returns the same shape that the URL textbox
 * produces: a plain string URL. That uniform shape is what keeps the rest
 * of the codebase (image rendering, product save, gallery, etc.) untouched.
 */

export interface UploadProgress {
  percent: number;
}

export interface UploadedImage {
  /** A directly embeddable URL — ready to store on the product. */
  url: string;
  /** Source provider identifier for diagnostics / future extension. */
  provider: 'cloudinary';
  /** Cloudinary public_id, useful for future server-side cleanup. */
  publicId?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}