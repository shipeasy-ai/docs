"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Product = {
  slug: string;
  name: string;
  href: string;
  desc: string;
  /** A representative color for the swatch. Mirrors the per-section accent in theme.css. */
  color: string;
};

const PRODUCTS: Product[] = [
  {
    slug: "i18n",
    name: "Polylang",
    href: "/i18n",
    desc: "Localized labels & AI translations",
    color: "oklch(0.74 0.17 245)",
  },
  {
    slug: "experiments",
    name: "Experiments",
    href: "/experiments",
    desc: "A/B tests, universes & metrics",
    color: "oklch(0.78 0.17 155)",
  },
  {
    slug: "configs",
    name: "Configs",
    href: "/configs",
    desc: "Feature flags & dynamic values",
    color: "oklch(0.82 0.15 85)",
  },
  {
    slug: "llms",
    name: "AI Agents",
    href: "/llms",
    desc: "MCP server & agent guides",
    color: "oklch(0.72 0.18 295)",
  },
];

function sectionFromPath(pathname: string | null): string {
  if (!pathname) return "";
  const seg = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
  return seg;
}

export function ProductSwitcher() {
  const pathname = usePathname();
  const section = sectionFromPath(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync the section to <html data-section="…"> so the theme's
  // per-section accent overrides take effect.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.section = section || "";
  }, [section]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = PRODUCTS.find((p) => p.slug === section) ?? {
    slug: "",
    name: "Platform",
    href: "/",
    desc: "Overview",
    color: "oklch(0.78 0.17 155)",
  };

  return (
    <span
      className="se-product-switcher"
      data-open={open ? "true" : "false"}
      ref={ref}
      style={{ position: "relative" }}
    >
      <span className="se-ps-sep">/</span>
      <button
        type="button"
        className="se-ps-current"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {current.name}
        <span className="se-ps-caret">▾</span>
      </button>
      {open ? (
        <>
          <div className="se-ps-backdrop" onClick={() => setOpen(false)} />
          <div className="se-ps-menu" role="menu">
            {PRODUCTS.map((p) => (
              <a
                key={p.slug}
                href={p.href}
                className={`se-ps-item ${p.slug === current.slug ? "active" : ""}`}
                style={{ color: p.color }}
                onClick={() => setOpen(false)}
              >
                <span className="swatch" style={{ background: p.color }} />
                <span className="body">
                  <span className="name">{p.name}</span>
                  <span className="desc">{p.desc}</span>
                </span>
              </a>
            ))}
          </div>
        </>
      ) : null}
    </span>
  );
}
