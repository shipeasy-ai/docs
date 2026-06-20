"use client";

import { useEffect, useId, useRef, useState } from "react";

let initialized = false;

async function ensureMermaid() {
  const m = await import("mermaid");
  const mermaid = m.default;
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      fontFamily: "var(--se-font-sans), ui-sans-serif, system-ui, sans-serif",
      flowchart: {
        curve: "basis",
        nodeSpacing: 56,
        rankSpacing: 64,
        padding: 18,
        htmlLabels: true,
        useMaxWidth: true,
      },
      themeVariables: {
        background: "transparent",
        // Default node fill (un-classed + decision rhombus nodes)
        primaryColor: "#16131c",
        primaryTextColor: "#ece9f5",
        primaryBorderColor: "#4a4458",
        // Edges
        lineColor: "#6b6478",
        // Node labels + edge labels
        edgeLabelBackground: "#0f0f10",
        // Cluster / subgraph backgrounds
        secondaryColor: "#141119",
        tertiaryColor: "#0f0f10",
        clusterBkg: "#100e16",
        clusterBorder: "#2e2c38",
        titleColor: "#cbc9d6",
        fontSize: "14px",
      },
    });
    initialized = true;
  }
  return mermaid;
}

/**
 * Renders a mermaid diagram from MDX. Pass the diagram source as the only
 * child string. Falls back to a `<pre>` block on render failure so authoring
 * mistakes don't break the page.
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await ensureMermaid();
        const { svg } = await mermaid.render(`mmd-${id}`, chart);
        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="se-mermaid-error" style={{ overflow: "auto", padding: 12 }}>
        <code>{`Mermaid render error: ${error}\n\n${chart}`}</code>
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="se-mermaid not-prose"
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
