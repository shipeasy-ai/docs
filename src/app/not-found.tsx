import type { Metadata } from "next";
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
import { Card, CardGrid } from "@/components/mdx";

/**
 * The 404, rendered inside the docs shell so a dead link still lands somewhere
 * navigable — sidebar, search and product tabs all work from here.
 *
 * This site has moved a lot of URLs (`public/_redirects` is the record), and
 * the ones that get here are the ones no redirect covers: an old deep link, a
 * hand-typed path, a page an agent inferred from a naming pattern. Next's stock
 * 404 is a bare centered string with no navigation at all, which turns a
 * one-click recovery into a trip back to Google.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <DocsPage tableOfContent={{ enabled: false }} breadcrumb={{ enabled: false }}>
      <DocsTitle>Page not found</DocsTitle>
      <DocsDescription>
        This URL does not point at a page — it may have moved, or never existed
      </DocsDescription>
      <DocsBody>
        <p>
          Search is in the top bar and covers every page. If you followed a link from our own docs,{" "}
          <a href="https://github.com/shipeasy-ai/docs/issues/new">tell us which one</a> and we will
          fix it
        </p>

        <CardGrid>
          <Card href="/" eyebrow="Start" title="Documentation home">
            Every product, one page — flags and configs, metrics and alerts, bug capture
          </Card>
          <Card href="/get-started/quickstart" eyebrow="5 minutes" title="Quickstart">
            Install, wire one <code>configure()</code> call, ship a flag
          </Card>
          <Card href="/get-started/cli-reference" eyebrow="Reference" title="CLI reference">
            Every <code>shipeasy</code> command, its flags and its output
          </Card>
          <Card href="/api" eyebrow="Reference" title="API reference">
            Every admin endpoint, with a copy-pasteable curl for each
          </Card>
          <Card href="/sdks" eyebrow="Reference" title="SDKs">
            One package for server plus browser, and native ports for eight more languages
          </Card>
          <Card href="/get-started/llms" eyebrow="For agents" title="llms.txt and agents.md">
            The whole documentation as one file, and a setup runbook an agent can follow
          </Card>
        </CardGrid>
      </DocsBody>
    </DocsPage>
  );
}
