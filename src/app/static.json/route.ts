import { createFromSource } from "fumadocs-core/search/server";
import type { StructuredData } from "fumadocs-core/mdx-plugins";
import { source } from "@/lib/source";
import { isGeneratedPage } from "@/lib/generated-pages";

// Static on-site search for the `output: "export"` build. `staticGET` emits a
// single JSON index at /static.json that the client-side Orama search reads —
// no server, so it works on the assets-only `shipeasy-docs` Worker.
export const dynamic = "force-static";
export const revalidate = false;

/**
 * The whole index is one file the reader downloads before their first search,
 * so what goes in it is a budget, not a free choice. Two thirds of the pages
 * here are machine-written reference — API operations and per-language SDK
 * method pages — and their bodies are parameter tables and field lists whose
 * words are already in the title and the headings. Indexing those paragraphs
 * costs real download for hits nobody wants: a search for "rollout" should
 * land on the guide that explains it, not on the twelfth SDK's parameter list.
 *
 * So generated pages are indexed by title, description and headings only.
 * Authored prose — the part people search — is indexed in full.
 */
interface Indexable {
  title?: string;
  structuredData?: StructuredData | (() => Promise<StructuredData>);
  load?: () => Promise<{ structuredData: StructuredData }>;
}

async function structuredDataOf(data: Indexable): Promise<StructuredData> {
  if (data.structuredData) {
    return typeof data.structuredData === "function"
      ? await data.structuredData()
      : data.structuredData;
  }
  if (data.load) return (await data.load()).structuredData;
  throw new Error(`No structured data to index for ${data.title ?? "an untitled page"}`);
}

export const { staticGET: GET } = createFromSource(source, {
  async buildIndex(page) {
    const structuredData = await structuredDataOf(page.data as Indexable);

    return {
      id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      // The product a page belongs to, so a search can be narrowed to it. Five
      // pages are called "Quickstart" and every product has an "Overview" — the
      // filter is how you say which one you meant. `SEARCH_TAGS` in
      // `src/components/search-dialog.tsx` is the list the reader picks from.
      tag: page.url.split("/")[1] ?? "",
      structuredData: isGeneratedPage(page.path)
        ? { headings: structuredData.headings, contents: [] }
        : structuredData,
    };
  },
});
