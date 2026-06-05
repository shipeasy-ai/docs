import type { MetadataRoute } from "next";
import { getPages } from "@/lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = getPages();
  return pages.map((page) => ({
    url: `https://docs.shipeasy.ai/${page.slugs.join("/")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page.slugs.length === 1 ? 0.9 : 0.7,
  }));
}
