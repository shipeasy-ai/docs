import { notFound } from "next/navigation";
import type { InferPageType } from "fumadocs-core/source";
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { APIPage } from "@/lib/openapi";
import { getPage, getPages } from "@/lib/source";
import {
  ApiRow,
  ApiTable,
  Callout,
  Card,
  CardGrid,
  ConvertCTA,
  DocFeedback,
  DocMeta,
  DocNav,
  Hero,
  InstallTabs,
  Out,
  Pill,
  Prompt,
  Quickstart,
  QuickstartStep,
  Step,
  Steps,
  Terminal,
  Tile,
  TileGrid,
} from "@/components/mdx";

type Page = InferPageType<typeof import("@/lib/source").source>;

interface Props {
  params: Promise<{ slug?: string[] }>;
}

const components = {
  ...defaultMdxComponents,
  APIPage,
  ApiRow,
  ApiTable,
  Callout,
  Card,
  CardGrid,
  ConvertCTA,
  DocFeedback,
  DocMeta,
  DocNav,
  Hero,
  InstallTabs,
  Out,
  Pill,
  Prompt,
  Quickstart,
  QuickstartStep,
  Step,
  Steps,
  Terminal,
  Tile,
  TileGrid,
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = getPage(slug ?? []) as Page | undefined;

  if (!page) notFound();

  const MDX = page.data.body;
  const isRoot = !slug || slug.length === 0;

  return (
    <DocsPage toc={page.data.toc} tableOfContent={isRoot ? { enabled: false } : undefined}>
      {!isRoot ? <DocsTitle>{page.data.title}</DocsTitle> : null}
      {!isRoot && page.data.description ? (
        <DocsDescription>{page.data.description}</DocsDescription>
      ) : null}
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return getPages().map((page) => ({ slug: page.slugs }));
}
