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
        // Decision (rhombus) nodes
        primaryColor: "#0f1813",
        primaryTextColor: "#e6f2eb",
        primaryBorderColor: "#3a4a42",
        // Edges
        lineColor: "#5a6f64",
        // Node labels + edge labels
        edgeLabelBackground: "#0a0f0c",
        // Cluster / secondary
        secondaryColor: "#0e1a14",
        tertiaryColor: "#0a0f0c",
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
