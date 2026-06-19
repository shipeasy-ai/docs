import type { InferPageType } from "fumadocs-core/source";
import { getPage, getPages } from "@/lib/source";
import { ogParamToSlug, ogSection, ogSlugToParam, renderOgImage } from "@/lib/og";

type Page = InferPageType<typeof import("@/lib/source").source>;

// Per-page Open Graph images live here rather than as an `opengraph-image`
// metadata-file convention: Next forbids that convention inside the catch-all
// docs route ("catch-all must be the last part of the URL"). Instead each page
// links its image URL explicitly via `docMetadata`, and this handler renders
// the PNG. `output: "export"` (next.config.ts) pre-renders one static PNG per
// `generateStaticParams` entry at build time.
export const dynamic = "force-static";

export function generateStaticParams(): Array<{ slug: string }> {
  return getPages()
    .filter((page) => page.slugs.length > 0)
    .map((page) => ({ slug: ogSlugToParam(page.slugs) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: param } = await params;
  const slug = ogParamToSlug(param);
  const page = getPage(slug) as Page | undefined;
  return renderOgImage(page?.data.title ?? "Shipeasy Docs", ogSection(slug));
}
