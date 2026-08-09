"use client";

import type { ReactNode } from "react";
import type { TOCItemType } from "fumadocs-core/toc";
import dynamic from "next/dynamic";
import { DocsPage } from "fumadocs-ui/page";
import { TOCPopover, TOCProvider } from "fumadocs-ui/layouts/docs/page/slots/toc";
import type { ApiSidebar as ApiSidebarT } from "./api-list";

/**
 * Client-side wrapper around fumadocs `DocsPage` that injects `<ApiSidebar />`
 * into the TOC slot. Overriding `slots.toc` requires providing all three
 * sub-slots (provider, main, popover) — fumadocs does not merge with defaults.
 *
 * The sidebar loads client-side only: it comes from `api-list.tsx`, which
 * bundles the ~1 MB OpenAPI spec, and a static import here would put that in
 * the chunk every page of the site downloads. Nothing is lost by skipping it
 * on the server — it is a nav rendered from a spec, and the page's prose still
 * server-renders around it.
 */
const ApiSidebar = dynamic(() => import("./api-list").then((m) => m.ApiSidebar), {
  ssr: false,
}) as typeof ApiSidebarT;

export function ApiDocsPage({ toc, children }: { toc?: TOCItemType[]; children: ReactNode }) {
  return (
    <DocsPage
      toc={toc}
      slots={{
        toc: {
          provider: TOCProvider,
          main: ApiSidebar,
          popover: TOCPopover,
        },
      }}
    >
      {children}
    </DocsPage>
  );
}
