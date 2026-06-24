import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { InferPageType } from "fumadocs-core/source";
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { APIPage } from "@/lib/openapi";
import { getPage } from "@/lib/source";
import { ogSlugToParam } from "@/lib/og";
import { BASE_URL, pageUrl } from "@/lib/urls";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Mermaid } from "@/components/mermaid";
import { AlertChartLive } from "@/components/alert-chart-live";
import {
  AssistantCardScene,
  AssistantChooserScene,
  AssistantPlanScene,
  AssistantReadScene,
  CaptureScene,
  ConfidenceScene,
  DevtoolsHero,
  LocaleFanScene,
  MetricPulseScene,
  RolloutScene,
  SlackAssistantScene,
  SlackAssistantThreadScene,
  SlackFeedbackScene,
  SlackNotifyScene,
} from "@/components/doc-scenes";
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
  JourneyPath,
  Out,
  Pill,
  Prompt,
  Quickstart,
  QuickstartStep,
  SeeAlso,
  Step,
  Steps,
  Terminal,
  Tile,
  TileGrid,
} from "@/components/mdx";

type Page = InferPageType<typeof import("@/lib/source").source>;

// "Edit this page" target — the source MDX in the monorepo. `page.path` is the
// virtual path relative to the content dir (e.g. "sdks/node-typescript.mdx").
const EDIT_BASE = "https://github.com/shipeasy-ai/shipeasy2/edit/main/apps/docs/content/docs";

// JSON-LD for a doc page: a TechArticle node plus a BreadcrumbList walking the
// slug prefixes (each segment resolved to its page title). Rendered as a single
// `application/ld+json` script so Google can build rich results + breadcrumbs.
function buildJsonLd(page: Page, slug: string[]): object[] {
  const article = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.data.title,
    ...(page.data.description ? { description: page.data.description } : {}),
    url: pageUrl(slug),
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: "Shipeasy Docs", url: BASE_URL },
    publisher: { "@type": "Organization", name: "Shipeasy", url: "https://shipeasy.ai" },
  };

  const crumbs = [{ name: "Docs", url: `${BASE_URL}/` }];
  for (let i = 0; i < slug.length; i++) {
    const sub = slug.slice(0, i + 1);
    const p = getPage(sub) as Page | undefined;
    crumbs.push({ name: p?.data.title ?? sub[i], url: pageUrl(sub) });
  }
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };

  return [article, breadcrumb];
}

const components = {
  ...defaultMdxComponents,
  AlertChartLive,
  APIPage,
  ApiList,
  ApiRow,
  ApiTable,
  AssistantCardScene,
  AssistantChooserScene,
  AssistantPlanScene,
  AssistantReadScene,
  Callout,
  CaptureScene,
  Card,
  CardGrid,
  ConfidenceScene,
  ConvertCTA,
  DecisionPicker,
  DevtoolsHero,
  DocFeedback,
  DocMeta,
  DocNav,
  Hero,
  InstallTabs,
  JourneyPath,
  LocaleFanScene,
  Mermaid,
  MetricPulseScene,
  Out,
  Pill,
  Prompt,
  Quickstart,
  QuickstartStep,
  RolloutScene,
  SeeAlso,
  SlackAssistantScene,
  SlackAssistantThreadScene,
  SlackFeedbackScene,
  SlackNotifyScene,
  Step,
  Steps,
  Tab,
  Tabs,
  Terminal,
  Tile,
  TileGrid,
};

// Renders a doc page for the given slug (empty array = the home hub at "/").
// Shared by the root route (`app/page.tsx`) and the catch-all
// (`app/[...slug]/page.tsx`) so the routing split stays DRY.
export function DocPageView({ slug }: { slug: string[] }) {
  const isRoot = slug.length === 0;
  const page = getPage(slug) as Page | undefined;

  if (!page) notFound();

  const MDX = page.data.body;
  // API reference page replaces the default heading TOC with the nested
  // endpoint nav rendered by `<ApiSidebar />` (and shares state with the
  // body via `ApiProvider`).
  const isApi = slug.length > 0 && slug[slug.length - 1] === "api";

  const jsonLd = buildJsonLd(page, slug);

  const inner = (
    <>
      <script
        type="application/ld+json"
        // JSON-LD is trusted, build-time content — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {!isRoot ? <DocsTitle>{page.data.title}</DocsTitle> : null}
      {!isRoot && page.data.description ? (
        <DocsDescription>{page.data.description}</DocsDescription>
      ) : null}
      <DocsBody>
        <MDX components={components} />
        {/* Rendered once per page (not in MDX) so every page carries it. */}
        {!isRoot ? (
          <DocFeedback
            page={slug.join("/")}
            editHref={page.path ? `${EDIT_BASE}/${page.path}` : undefined}
          />
        ) : null}
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

// Per-page metadata (title, description, canonical, OG/Twitter). The home hub
// ("/") inherits the rich root metadata from `app/layout.tsx`, so callers pass
// an empty slug to get `{}`.
export function docMetadata(slug: string[]): Metadata {
  if (slug.length === 0) return {};

  const page = getPage(slug) as Page | undefined;
  if (!page) return {};

  const url = pageUrl(slug);
  const description = page.data.description ?? undefined;
  const ogImage = `${BASE_URL}/og/${ogSlugToParam(slug)}`;

  return {
    title: page.data.title,
    description,
    openGraph: {
      title: page.data.title,
      // Fall back to the page title so a page without its own description still
      // gets a meaningful OG description instead of inheriting the generic root
      // one.
      description: description ?? page.data.title,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: page.data.title }],
    },
    twitter: {
      title: page.data.title,
      description: description ?? page.data.title,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}
