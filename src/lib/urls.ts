export const BASE_URL = "https://docs.shipeasy.ai";

// Canonical/sitemap/structured-data URL. The site is served with
// `trailingSlash: true` (next.config.ts), so every emitted URL must carry the
// trailing slash — canonical, sitemap <loc>, and JSON-LD must all agree, or
// Google treats the slash and no-slash forms as two competing URLs.
export function pageUrl(slug: string[]): string {
  return slug.length === 0 ? `${BASE_URL}/` : `${BASE_URL}/${slug.join("/")}/`;
}
