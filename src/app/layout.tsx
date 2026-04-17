import type { ReactNode } from "react";
import type { Metadata } from "next";
import "fumadocs-ui/style.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { source } from "@/lib/source";

export const metadata: Metadata = {
  title: "ShipEasy Docs",
  description: "Documentation for the ShipEasy experiment platform",
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  Configs: "Feature flags & dynamic values",
  Experiments: "A/B tests, universes & metrics",
  "String Manager": "Localized labels & translations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>
          <DocsLayout
            tree={source.pageTree}
            nav={{ title: "ShipEasy" }}
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
