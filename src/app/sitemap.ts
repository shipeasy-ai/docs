import type { MetadataRoute } from "next";
import { getPages } from "@/lib/source";
import { pageUrl } from "@/lib/urls";
import { isGeneratedPage } from "@/lib/generated-pages";
import updated from "@/lib/updated.json";

// Required under `output: "export"` — emit this metadata route as a static file.
export const dynamic = "force-static";

/**
 * Every entry used to claim `lastModified: new Date()` — the build time. A
 * sitemap where all 295 pages changed at the same instant, on every deploy,
 * tells a crawler nothing, and a crawler that learns the dates are noise stops
 * reading them. The real per-page dates now exist (`generated/data/updated.json`,
 * stamped at commit time), so use them.
 *
 * Priority was inverted too: the rule was `slugs.length === 1 ? 0.9 : 0.7`,
 * which gave the home page — length 0 — the lowest score on the site.
 */
function priorityOf(slugs: string[], path: string | undefined): number {
  if (slugs.length === 0) return 1.0; // the home hub
  if (isGeneratedPage(path)) return 0.5; // per-operation and per-method reference
  if (slugs.length === 1) return 0.9; // a product landing page
  return 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = updated as Record<string, string>;

  return getPages().map((page) => {
    const day = dates[`/${page.slugs.join("/")}`];
    return {
      // Trailing slash to match the canonical URL (the site is `trailingSlash: true`).
      url: pageUrl(page.slugs),
      lastModified: day ? new Date(`${day}T00:00:00Z`) : undefined,
      changeFrequency: "weekly" as const,
      priority: priorityOf(page.slugs, page.path),
    };
  });
}
