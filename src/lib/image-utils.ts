/**
 * Normalizes image URLs.
 * - Converts Google Drive URLs to embeddable format
 * - Rewrites internal Appwrite Storage URLs (172.x.x.x) to public Appwrite Cloud URLs
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Rewrite internal Appwrite Storage URLs to public Appwrite Cloud URLs
  // Pattern: http://172.172.160.120/v1/storage/buckets/{bucketId}/files/{fileId}/...
  const appwriteInternalPattern = /https?:\/\/172\.\d+\.\d+\.\d+\/v1\/storage\/buckets\/([^/]+)\/files\/([^/?]+)/;
  const internalMatch = trimmed.match(appwriteInternalPattern);
  if (internalMatch) {
    const bucketId = internalMatch[1];
    const fileId = internalMatch[2];
    const projectId = '6952e922001783db4a09';
    return `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
  }

  // Block other private/localhost URLs
  if (
    trimmed.match(/^https?:\/\/192\.168\./) ||
    trimmed.match(/^https?:\/\/10\./) ||
    trimmed.match(/^https?:\/\/localhost/)
  ) {
    return '/placeholder.svg';
  }

  // Extract file ID from any known Drive URL format
  let fileId = '';

  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (fileMatch) fileId = fileMatch[1];

  if (!fileId) {
    const openMatch = trimmed.match(/drive\.google\.com\/open\?[^"]*[?&]id=([^&]+)/);
    if (openMatch) fileId = openMatch[1];
  }

  if (!fileId) {
    const ucMatch = trimmed.match(/drive\.google\.com\/uc\?[^"]*[?&]id=([^&]+)/);
    if (ucMatch) fileId = ucMatch[1];
  }

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
  return getProductImages(image)[0];
}

/** Returns all usable URLs from a product's pipe-separated image value. */
export function getProductImages(image: string | undefined | null): string[] {
  if (!image) return ['/placeholder.svg'];
  const images = image.split('|').map(normalizeImageUrl).filter(Boolean);
  return images.length > 0 ? images : ['/placeholder.svg'];
}
