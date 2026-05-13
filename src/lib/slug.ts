/**
 * Convert product name to URL-friendly slug
 * e.g. "Manicure Nail Cutter Set" → "manicure-nail-cutter-set"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/[\s_]+/g, '-')    // spaces/underscores → hyphens
    .replace(/--+/g, '-')       // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens
}

/**
 * Build product URL — just the name slug, no ID
 * e.g. "manicure-nail-cutter-set"
 */
export function productSlug(name: string, _id?: string): string {
  return slugify(name);
}

/**
 * Extract product ID from slug.
 * Since we no longer embed the ID, this just returns the slug as-is
 * and useProduct will do a name search.
 */
export function extractProductId(slug: string): string {
  return slug;
}
