import type { MetadataRoute } from "next";
import { getPages } from "@/lib/source";
import { pageUrl } from "@/lib/urls";

// Required under `output: "export"` — emit this metadata route as a static file.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = getPages();
  return pages.map((page) => ({
    // Trailing slash to match the canonical URL (the site is `trailingSlash: true`).
    url: pageUrl(page.slugs),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page.slugs.length === 1 ? 0.9 : 0.7,
  }));
}
