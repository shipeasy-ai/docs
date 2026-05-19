import { notFound } from "next/navigation";
import type { InferPageType } from "fumadocs-core/source";
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { APIPage } from "@/lib/openapi";
import { getPage, getPages } from "@/lib/source";
import { Mermaid } from "@/components/mermaid";
import { ApiList, ApiProvider } from "@/components/api-list";
import { ApiDocsPage } from "@/components/api-docs-page";
import {
  ApiRow,
  ApiTable,
  Callout,
  Card,
  CardGrid,
  ConvertCTA,
  DecisionPicker,
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
  ApiList,
  ApiRow,
  ApiTable,
  Callout,
  Card,
  CardGrid,
  ConvertCTA,
  DecisionPicker,
  DocFeedback,
  DocMeta,
  DocNav,
  Hero,
  InstallTabs,
  Mermaid,
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
  const isRoot = !slug || slug.length === 0;

  if (isRoot) {
    const target = "/flags-experiments/";
    return (
      <>
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace(${JSON.stringify(target)});`,
          }}
        />
        <noscript>
          <p>
            Redirecting to <a href={target}>Flags &amp; Experiments</a>…
          </p>
        </noscript>
      </>
    );
  }

  const page = getPage(slug) as Page | undefined;

  if (!page) notFound();

  const MDX = page.data.body;
  // API reference page replaces the default heading TOC with the nested
  // endpoint nav rendered by `<ApiSidebar />` (and shares state with the
  // body via `ApiProvider`).
  const isApi = !!slug && slug[slug.length - 1] === "api";

  const inner = (
    <>
      {!isRoot ? <DocsTitle>{page.data.title}</DocsTitle> : null}
      {!isRoot && page.data.description ? (
        <DocsDescription>{page.data.description}</DocsDescription>
      ) : null}
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
    </>
  );

  if (isApi) {
    return (
      <ApiProvider>
        <ApiDocsPage toc={page.data.toc}>{inner}</ApiDocsPage>
      </ApiProvider>
    );
  }

  return (
    <DocsPage toc={page.data.toc} tableOfContent={isRoot ? { enabled: false } : undefined}>
      {inner}
    </DocsPage>
  );
}

export function generateStaticParams(): Array<{ slug?: string[] }> {
  const entries: Array<{ slug?: string[] }> = [{ slug: undefined }];
  for (const page of getPages()) {
    if (page.slugs.length > 0) entries.push({ slug: page.slugs });
  }
  return entries;
}
