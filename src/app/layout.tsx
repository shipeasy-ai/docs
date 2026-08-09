import type { ReactNode } from "react";
import type { Metadata } from "next";
import "fumadocs-ui/style.css";
import "./theme.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { source } from "@/lib/source";
import { Logo } from "@/components/logo";
import SearchDialog from "@/components/search-dialog";

const BASE_URL = "https://docs.shipeasy.ai";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: "Shipeasy Docs", template: "%s — Shipeasy Docs" },
  description:
    "Shipeasy developer documentation. Guides and API reference for feature flags, kill switches, runtime configs, metrics and alerts — all served from the edge.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Shipeasy Docs",
    title: "Shipeasy Docs — Feature Flags, Configs & Metrics",
    description:
      "Developer docs for Shipeasy: feature flags, kill switches, runtime configs, metrics and alerts. Install via MCP in 12 seconds.",
    images: [
      {
        url: "https://shipeasy.ai/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Shipeasy Docs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipeasy Docs — Feature Flags, Configs & Metrics",
    description:
      "Developer docs for feature flags, kill switches, runtime configs, metrics and alerts. Served from the edge.",
    images: ["https://shipeasy.ai/opengraph-image"],
    creator: "@shipeasyai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  "Flags & Configs": "Gates, configs & kill switches",
  "Bugs & Requests": "Bug reports & feature requests",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <RootProvider
          theme={{ enabled: false, defaultTheme: "dark", forcedTheme: "dark" }}
          search={{ options: { type: "static", api: "/static.json" }, SearchDialog }}
        >
          <DocsLayout
            tree={source.pageTree}
            nav={{
              title: (
                <span className="flex items-center gap-2 font-semibold">
                  <Logo className="size-5" />
                  Shipeasy
                </span>
              ),
            }}
            sidebar={{
              tabs: {
                transform(option) {
                  const key = typeof option.title === "string" ? option.title : "";
                  return {
                    ...option,
                    description: PRODUCT_DESCRIPTIONS[key] ?? option.description,
                  };
                },
              },
            }}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
