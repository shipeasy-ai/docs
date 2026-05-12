import type { ReactNode } from "react";
import type { Metadata } from "next";
import "fumadocs-ui/style.css";
import "./theme.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { source } from "@/lib/source";
import { Logo } from "@shipeasy/shared/Logo";
import { ProductSwitcher } from "@/components/product-switcher";

export const metadata: Metadata = {
  title: { default: "ShipEasy Docs", template: "%s — ShipEasy" },
  description:
    "Feature flags, A/B experiments, and managed translations served from the edge — without a redeploy.",
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  "Flags & Experiments": "Gates, configs, killswitches & A/B tests",
  Translations: "Localized labels & AI translations",
  "Bugs & Requests": "Bug reports & feature requests",
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
                  ShipEasy
                  <ProductSwitcher />
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
