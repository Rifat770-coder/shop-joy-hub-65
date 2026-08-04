import { useEffect, useRef, useState } from 'react';
import { Loader2, ImageIcon, Upload, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  getCloudinaryConfig,
  uploadToCloudinary,
  validateImageFile,
} from '@/services/uploads';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'uploading' | 'success' | 'error';

interface CloudinaryUploadFieldProps {
  /** Externally managed URL — uploads write here, removals clear it. */
  value: string;
  onChange: (nextUrl: string) => void;
  /** Optional folder override (e.g. by product id). */
  folder?: string;
  /** Optional tags for the Cloudinary asset. */
  tags?: string[];
  /** Hint shown on the upload area. */
  label?: string;
  id?: string;
  className?: string;
  /** Fine-grained disable. */
  disabled?: boolean;
}

/**
 * Cloudinary upload field.
 *
 * Self-contained:
 *  - Native file picker.
 *  - Client-side validation (size, type).
 *  - Uploads via XHR with progress.
 *  - Surfaces user-friendly errors.
 *  - Previews the uploaded image and offers Remove / Re-upload.
 *
 * Pure addition: the parent component owns the URL string, so the rest of
 * the admin form (URL list, normalization, save) is untouched.
 */
export function CloudinaryUploadField({
  value,
  onChange,
  folder,
  tags,
  label = 'Upload to Cloudinary',
  id,
  className,
  disabled,
}: CloudinaryUploadFieldProps) {
  const config = getCloudinaryConfig();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>(value ? 'success' : 'idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

  // Keep the preview in sync when the parent clears/changes the URL externally.
  useEffect(() => {
    setPreviewUrl(value || null);
    if (value) setStatus('success');
    else setStatus('idle');
  }, [value]);

  // Revoke any object URLs we create to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!config) {
    return (
      <div className={cn('rounded-md border border-dashed p-3 text-xs text-muted-foreground', className)}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <div>
            Cloudinary is not configured. Set
            <code className="mx-1 px-1 py-0.5 rounded bg-muted">VITE_CLOUDINARY_CLOUD_NAME</code>
            and
            <code className="mx-1 px-1 py-0.5 rounded bg-muted">VITE_CLOUDINARY_UPLOAD_PRESET</code>
            in your <code>.env</code> file to enable Cloudinary uploads.
          </div>
        </div>
      </div>
    );
  }

  const handlePick = () => {
    if (disabled || status === 'uploading') return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStatus('uploading');
    setProgress(0);

    // Local preview while uploading.
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      validateImageFile(file);
      const result = await uploadToCloudinary(file, {
        folder,
        tags,
        onProgress: (pct) => setProgress(pct),
      });
      // The secure URL is ready to be stored as the product image.
      onChange(result.secureUrl);
      setStatus('success');
      setProgress(100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed.';
      setError(message);
      setStatus('error');
      // Roll back local preview so the displayed image matches the parent value.
      setPreviewUrl(value || null);
    } finally {
      // If the preview was the temporary blob, swap it for the new URL.
      if (objectUrl && status !== 'error') {
        // The parent now holds the real URL — it will become the preview
        // via the effect above.
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const handleRemove = () => {
    if (status === 'uploading') return;
    onChange('');
    setStatus('idle');
    setProgress(0);
    setError(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isUploading = status === 'uploading';
  const isSuccess = status === 'success' && !!previewUrl;
  const isError = status === 'error';

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled || isUploading}
      />

      <div
        className={cn(
          'rounded-md border border-dashed bg-muted/30 overflow-hidden',
          'transition-colors',
          isError && 'border-destructive/60',
          isSuccess && 'border-emerald-500/40'
        )}
      >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Cloudinary upload preview"
              className="w-full h-40 object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-xs gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading… {progress}%</span>
              </div>
            )}
            {isSuccess && !isUploading && (
              <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Cloudinary
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePick}
            disabled={disabled || isUploading}
            className={cn(
              'w-full h-40 flex flex-col items-center justify-center gap-2',
              'text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            <div className="rounded-full bg-background p-2 shadow-sm">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span>Click to upload an image</span>
            <span className="text-xs">JPG, PNG, WEBP, GIF, AVIF — up to 10 MB</span>
          </button>
        )}
      </div>

      {isUploading && (
        <Progress value={progress} className="h-1.5" />
      )}

      {isError && error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          disabled={disabled || isUploading}
          className="gap-1"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : previewUrl ? (
            <Upload className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {previewUrl ? 'Re-upload' : 'Choose image'}
        </Button>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}