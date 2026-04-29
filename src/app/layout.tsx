import type { ReactNode } from "react";
import type { Metadata } from "next";
import "fumadocs-ui/style.css";
import "./theme.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { source } from "@/lib/source";
import { Logo } from "@shipeasy/shared/Logo";

export const metadata: Metadata = {
  title: { default: "ShipEasy Docs", template: "%s — ShipEasy" },
  description:
    "Feature flags, A/B experiments, and managed translations served from the edge — without a redeploy.",
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  "Get started": "Install, authenticate, and ship",
  Configs: "Feature flags & dynamic values",
  Experiments: "A/B tests, universes & metrics",
  "String Manager": "Localized labels & translations",
  "AI Agents": "MCP server & agent guides",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <RootProvider theme={{ enabled: false, defaultTheme: "dark", forcedTheme: "dark" }}>
          <DocsLayout
            tree={source.pageTree}
            nav={{
              title: (
                <span className="flex items-center gap-2 font-semibold">
                  <Logo className="size-5" />
                  ShipEasy <span style={{ opacity: 0.45, fontWeight: 400 }}>docs</span>
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
