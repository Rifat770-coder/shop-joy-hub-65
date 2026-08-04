import { useEffect, useMemo, useState } from 'react';
import { XCircle, PlusCircle, Link2, Cloud } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CloudinaryUploadField } from './CloudinaryUploadField';
import { getCloudinaryConfig } from '@/services/uploads';
import { isCloudinaryUrl } from '@/services/uploads';
import { cn } from '@/lib/utils';

export type ImageSource = 'appwrite' | 'cloudinary';

/**
 * Heuristic that derives the source from a stored URL.
 * Existing products (Appwrite URL, ImgBB, Unsplash, etc.) stay on the
 * Appwrite/URL branch by default.
 */
export function detectImageSource(url: string): ImageSource {
  if (isCloudinaryUrl(url)) return 'cloudinary';
  return 'appwrite';
}

interface ImageSourceFieldProps {
  /** The current URL of the primary image slot. */
  value: string;
  onChange: (nextUrl: string) => void;
  /** Optional folder hint for Cloudinary uploads. */
  folder?: string;
  /** Label shown above the field. */
  label?: string;
  /** Render with reduced vertical padding. */
  compact?: boolean;
}

/**
 * Single-slot image field with a source selector.
 *
 * - Source = "Appwrite (Existing)" → the existing URL textbox is shown
 *   unchanged. This is the default branch when the URL is not a Cloudinary
 *   URL, so all existing products keep their images intact.
 * - Source = "Cloudinary (New)" → a self-contained Cloudinary uploader
 *   replaces the URL textbox. The resulting secure URL is written back via
 *   `onChange`, identical to how a manual URL would be added.
 */
export function ImageSourceField({
  value,
  onChange,
  folder,
  label = 'Image',
  compact,
}: ImageSourceFieldProps) {
  const cloudinaryConfigured = useMemo(() => !!getCloudinaryConfig(), []);

  const [source, setSource] = useState<ImageSource>(
    detectImageSource(value)
  );

  // If the URL changes externally (e.g. user typed a cloudinary URL into
  // the textbox), keep the selector in sync.
  useEffect(() => {
    setSource(detectImageSource(value));
  }, [value]);

  return (
    <div className={cn('grid gap-3', compact && 'gap-2')}>
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {cloudinaryConfigured ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Source:</span>
            <Select
              value={source}
              onValueChange={(v) => setSource(v as ImageSource)}
            >
              <SelectTrigger className="h-8 w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appwrite">
                  <span className="inline-flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5" />
                    Appwrite (Existing URL)
                  </span>
                </SelectItem>
                <SelectItem value="cloudinary">
                  <span className="inline-flex items-center gap-2">
                    <Cloud className="h-3.5 w-3.5" />
                    Cloudinary (New)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {source === 'cloudinary' && cloudinaryConfigured ? (
        <CloudinaryUploadField
          value={value}
          onChange={onChange}
          folder={folder}
          label="Image"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://i.ibb.co/xxx/image.jpg"
        />
      )}
    </div>
  );
}

interface ImageSourceListFieldProps {
  /** Pipe-separated URL string saved on the product. */
  value: string;
  /** Receives the next pipe-separated string. */
  onChange: (next: string) => void;
  label?: string;
  /** Optional Cloudinary folder for all uploads in this list. */
  folder?: string;
}

/**
 * Multi-image variant. The first slot is a full source-aware field
 * (URL or Cloudinary upload); additional slots are URL-only — identical
 * to the current "Add another image" behavior, so nothing changes for
 * the multi-image case.
 */
export function ImageSourceListField({
  value,
  onChange,
  label = 'Image URLs',
  folder,
}: ImageSourceListFieldProps) {
  const urls = useMemo(
    () => (value ? value.split('|').filter(Boolean) : ['']),
    [value]
  );

  const updateSlot = (idx: number, nextUrl: string) => {
    const updated = [...urls];
    updated[idx] = nextUrl;
    onChange(updated.filter(Boolean).join('|'));
  };

  const addSlot = () => {
    onChange([...urls.filter(Boolean), ''].join('|'));
  };

  const removeSlot = (idx: number) => {
    const updated = urls.filter((_, i) => i !== idx);
    onChange(updated.filter(Boolean).join('|'));
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="text-xs text-muted-foreground -mt-1 space-y-0.5">
        <p>Use a direct image URL, or upload via Cloudinary.</p>
        <p>
          • <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="underline text-primary">imgbb.com</a> — upload → copy "Direct link"
        </p>
        <p>
          • <a href="https://imgur.com" target="_blank" rel="noreferrer" className="underline text-primary">imgur.com</a> — right-click image → copy image address
        </p>
      </div>

      {urls.map((url, idx) => (
        <div key={idx} className="grid gap-2">
          {idx === 0 ? (
            <ImageSourceField
              value={url}
              onChange={(next) => updateSlot(idx, next)}
              folder={folder}
              label={urls.length > 1 ? 'Primary image' : 'Image'}
            />
          ) : (
            <div className="flex gap-2 items-center">
              <Input
                value={url}
                onChange={(e) => updateSlot(idx, e.target.value)}
                placeholder="Additional image URL"
              />
              <button
                type="button"
                onClick={() => removeSlot(idx)}
                aria-label="Remove image"
              >
                <XCircle className="h-5 w-5 text-destructive" />
              </button>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1"
        onClick={addSlot}
      >
        <PlusCircle className="h-4 w-4" />
        Add another image
      </Button>
    </div>
  );
}