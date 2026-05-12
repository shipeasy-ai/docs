"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
    slug: "flags-experiments",
    name: "Flags & Experiments",
    href: "/flags-experiments",
    desc: "Gates, configs, killswitches & A/B tests",
    color: "oklch(0.78 0.17 155)",
  },
  {
    slug: "translations",
    name: "Translations",
    href: "/translations",
    desc: "Localized labels & AI translations",
    color: "oklch(0.74 0.17 245)",
  },
  {
    slug: "feedback",
    name: "Bugs & Requests",
    href: "/feedback",
    desc: "Bug reports & feature requests",
    color: "oklch(0.78 0.16 35)",
  },
];

function sectionFromPath(pathname: string | null): string {
  if (!pathname) return "";
  const seg = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
  return seg;
}

export function ProductSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
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

  // Switcher renders inside fumadocs' brand `<a href="/">`. Without
  // preventDefault on every interaction inside, clicks bubble to the parent
  // anchor and the browser navigates to "/" instead of toggling the menu or
  // following the per-product link. Stop the bubbling and route programmatically.
  const swallow = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <span
      className="se-product-switcher"
      data-open={open ? "true" : "false"}
      ref={ref}
      style={{ position: "relative" }}
      onClick={swallow}
      onMouseDown={swallow}
    >
      <span className="se-ps-sep">/</span>
      <button
        type="button"
        className="se-ps-current"
        onClick={(e) => {
          swallow(e);
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {current.name}
        <span className="se-ps-caret">▾</span>
      </button>
      {open ? (
        <>
          <div
            className="se-ps-backdrop"
            onClick={(e) => {
              swallow(e);
              setOpen(false);
            }}
          />
          <div className="se-ps-menu" role="menu">
            {PRODUCTS.map((p) => (
              <a
                key={p.slug}
                href={p.href}
                className={`se-ps-item ${p.slug === current.slug ? "active" : ""}`}
                style={{ color: p.color }}
                onClick={(e) => {
                  swallow(e);
                  setOpen(false);
                  router.push(p.href);
                }}
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
