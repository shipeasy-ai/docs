import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Human label for the product section, derived from the top-level slug segment.
const SECTION_LABELS: Record<string, string> = {
  flags: "Flags & Configs",
  api: "API reference",
  metrics: "Metrics & Alerts",
  feedback: "Bugs & Requests",
  sdks: "SDKs",
  "get-started": "Get Started",
  assistant: "Assistant",
};

export function ogSection(slug: string[]): string {
  return slug.length > 0 ? (SECTION_LABELS[slug[0]] ?? "Docs") : "Documentation";
}

// The OG image route uses a single dynamic segment, so the multi-segment doc
// slug is flattened to one param. Slugs themselves never contain a double
// hyphen, so `--` is a safe, reversible separator that keeps the param URL-safe.
// The `.png` suffix matters: the static export writes one file per param, and
// Cloudflare Workers Assets derives `Content-Type` from the file extension — a
// bare file would be served as octet-stream and social crawlers would refuse it.
export function ogSlugToParam(slug: string[]): string {
  return `${slug.join("--")}.png`;
}

export function ogParamToSlug(param: string): string[] {
  return param.replace(/\.png$/, "").split("--");
}

// Renders a branded social card with the page title + section label. Shared by
// the root `opengraph-image.tsx` and the catch-all one so both stay identical.
export function renderOgImage(title: string, section: string): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#080808",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px 96px",
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,220,180,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Brand mark + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "linear-gradient(135deg, #00dca0 0%, #00b4d8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 3, background: "#080808" }} />
        </div>
        <span style={{ fontSize: 26, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Shipeasy Docs
        </span>
      </div>

      {/* Title block */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#00dca0",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {section}
        </span>
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            maxWidth: 960,
          }}
        >
          {title}
        </span>
      </div>

      {/* Footer */}
      <div style={{ fontSize: 22, color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em" }}>
        docs.shipeasy.ai
      </div>
    </div>,
    OG_SIZE,
  );
}
