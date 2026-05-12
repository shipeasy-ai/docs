"use client";

import type { ReactNode } from "react";
import type { TOCItemType } from "fumadocs-core/toc";
import { DocsPage } from "fumadocs-ui/page";
import { TOCPopover, TOCProvider } from "fumadocs-ui/layouts/docs/page/slots/toc";
import { ApiSidebar } from "./api-list";

/**
 * Client-side wrapper around fumadocs `DocsPage` that injects `<ApiSidebar />`
 * into the TOC slot. Overriding `slots.toc` requires providing all three
 * sub-slots (provider, main, popover) — fumadocs does not merge with defaults.
 */
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
