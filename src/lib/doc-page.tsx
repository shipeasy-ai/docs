import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { InferPageType } from "fumadocs-core/source";
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { APIPage } from "@/lib/openapi";
import { getPage } from "@/lib/source";
import { isGeneratedPage } from "@/lib/generated-pages";
import updated from "@/lib/updated.json";
import { ogSlugToParam } from "@/lib/og";
import { BASE_URL, pageUrl } from "@/lib/urls";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Mermaid } from "@/components/mermaid";
// Client-side `ssr: false` boundaries — see the module's own note on why the
// two heaviest components cannot be imported straight into the shared map.
import { AlertChartLive, ApiList } from "@/components/heavy";
import { ApiProvider } from "@/components/api-context";
import { ApiDocsPage } from "@/components/api-docs-page";
import { PageActions } from "@/components/page-actions";
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
import { TypeTable } from "fumadocs-ui/components/type-table";
import {
  Callout,
  Card,
  CardGrid,
  Cmd,
  ConvertCTA,
  DecisionPicker,
  DocFeedback,
  DocMeta,
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
  ToolRow,
  ToolTable,
} from "@/components/mdx";

type Page = InferPageType<typeof import("@/lib/source").source>;

// "Edit this page" target — the source MDX in this repo. `page.path` is the
// virtual path relative to the content dir (e.g. "flags/gates/quickstart.mdx").
// Generated pages get no link: their file here is a gitignored mirror, so the
// URL would 404 and an edit to it would be overwritten by the next `pnpm gen`.
const EDIT_BASE = "https://github.com/shipeasy-ai/docs/edit/main/content/docs";

// Where the first breadcrumb crumb points: the product tab's own landing page
// (`/flags`, `/metrics`, …) when one exists, otherwise the docs home.
function rootUrl(slug: string[]): string {
  const first = slug[0];
  return first && getPage([first]) ? `/${first}` : "/";
}

// When this page last changed, from the map the pre-commit hook stamps
// (`scripts/stamp-updated.ts`). Hand-typed dates went stale the moment someone
// forgot one; nobody types this one. A page missing from the map is a page
// added since the last stamp — it gets no date rather than a wrong one.
function lastUpdate(slug: string[]): Date | undefined {
  const day = (updated as Record<string, string>)[`/${slug.join("/")}`];
  return day ? new Date(`${day}T00:00:00Z`) : undefined;
}

// This page as plain markdown — written per page by `pnpm gen:llms`, served
// straight out of `public/md`. Kept in step with `mdPath()` in that script.
function mdUrl(slug: string[]): string {
  return `/md/${slug.length === 0 ? "index" : slug.join("/")}.md`;
}

function editHrefFor(page: Page): string | undefined {
  if (!page.path || isGeneratedPage(page.path)) return undefined;
  return `${EDIT_BASE}/${page.path}`;
}

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
  AssistantCardScene,
  AssistantChooserScene,
  AssistantPlanScene,
  AssistantReadScene,
  Callout,
  CaptureScene,
  Card,
  CardGrid,
  Cmd,
  ConfidenceScene,
  ConvertCTA,
  DecisionPicker,
  DevtoolsHero,
  DocFeedback,
  DocMeta,
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
  ToolRow,
  ToolTable,
  TypeTable,
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
      {!isRoot ? <PageActions markdownUrl={mdUrl(slug)} editHref={editHrefFor(page)} /> : null}
      <DocsBody>
        <MDX components={components} />
        {/* Rendered once per page (not in MDX) so every page carries it. */}
        {!isRoot ? <DocFeedback page={slug.join("/")} editHref={editHrefFor(page)} /> : null}
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
    <DocsPage
      toc={page.data.toc}
      tableOfContent={isRoot ? { enabled: false } : undefined}
      // Fumadocs' default breadcrumb renders the containing folder alone — one
      // grey word with nothing to click. The full trail is what tells a reader
      // in a 295-page site where they landed from a search result, and it
      // mirrors the BreadcrumbList already in the JSON-LD above. The product
      // tab is the root of its own tree, so fumadocs has no url for it — hand
      // it the tab's own landing page when there is one.
      breadcrumb={isRoot ? { enabled: false } : { includeRoot: { url: rootUrl(slug) } }}
      lastUpdate={isRoot ? undefined : lastUpdate(slug)}
    >
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
