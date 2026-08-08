import type { CSSProperties } from "react";

/**
 * Shipeasy brand mark — conic-gradient ring + inner rounded square.
 * Matches BrandMark used in the dashboard sidebar and auth shell.
 *
 * Sized via CSS (className like `size-5` from tailwind, or inline width/height).
 * The mark sets its own background; `currentColor` is unused.
 */
export function Logo({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        position: "relative",
        borderRadius: "27%",
        background:
          "conic-gradient(from 140deg, var(--se-accent, #5dd39e), var(--se-bg, #0a0a0b) 40%, var(--se-accent, #5dd39e) 80%)",
        boxShadow: "0 0 0 1px var(--se-line-2, rgba(255,255,255,0.14))",
        ...style,
      }}
      aria-hidden="true"
    >
      <span
        style={{
          position: "absolute",
          inset: "23%",
          background: "var(--se-bg, #0a0a0b)",
          borderRadius: "14%",
          boxShadow: "inset 0 0 0 1px var(--se-line-2, rgba(255,255,255,0.14))",
        }}
      />
    </span>
  );
}
