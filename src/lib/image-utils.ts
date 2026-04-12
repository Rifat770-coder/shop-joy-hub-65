/**
 * Normalizes any Google Drive URL to lh3.googleusercontent.com which is
 * the only reliably embeddable format for Drive images in browsers.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Extract file ID from any known Drive URL format
  let fileId = '';

  // /file/d/ID/view  or  /file/d/ID
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (fileMatch) fileId = fileMatch[1];

  // open?id=ID
  if (!fileId) {
    const openMatch = trimmed.match(/drive\.google\.com\/open\?[^"]*[?&]id=([^&]+)/);
    if (openMatch) fileId = openMatch[1];
  }

  // uc?export=view&id=ID  or  uc?id=ID
  if (!fileId) {
    const ucMatch = trimmed.match(/drive\.google\.com\/uc\?[^"]*[?&]id=([^&]+)/);
    if (ucMatch) fileId = ucMatch[1];
  }

  // thumbnail?id=ID
  if (!fileId) {
    const thumbMatch = trimmed.match(/drive\.google\.com\/thumbnail\?[^"]*[?&]id=([^&]+)/);
    if (thumbMatch) fileId = thumbMatch[1];
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/** Returns the first image URL from a pipe-separated list, normalized. */
export function getPrimaryImage(image: string | undefined | null): string {
  if (!image) return '/placeholder.svg';
  const first = image.split('|')[0];
  return normalizeImageUrl(first) || '/placeholder.svg';
}
