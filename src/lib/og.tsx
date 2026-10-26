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
        background: "#15121a",
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
          top: -260,
          right: -160,
          width: 820,
          height: 820,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(169,137,255,0.22) 0%, transparent 68%)",
        }}
      />

      {/* Brand mark + name — the purple mark, transcribed from the monorepo's
          marketing/brand/shipeasy-logo-512.svg (gradient ring around a dark tile) */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #a78bfa 0%, #0a0a0b 45%, #a78bfa 100%)",
            border: "1px solid rgba(196,181,253,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 29,
              height: 29,
              borderRadius: 4,
              background: "#0a0a0b",
              border: "1px solid rgba(167,139,250,0.4)",
            }}
          />
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
            color: "#a989ff",
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
