import type { MetadataRoute } from "next";

// Required under `output: "export"` — emit this metadata route as a static file.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://docs.shipeasy.ai/sitemap.xml",
  };
}
