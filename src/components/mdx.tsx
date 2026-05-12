import type { ReactNode } from "react";
import { InstallTabsClient } from "./install-tabs-client";

type Tone = "info" | "success" | "warn" | "danger";

const ICONS: Record<Tone, string> = {
  info: "i",
  success: "✓",
  warn: "!",
  danger: "×",
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`se-callout tone-${type}`}>
      <span className="se-callout-icon" aria-hidden>
        {ICONS[type]}
      </span>
      <div className="se-callout-body">
        {title ? <strong>{title}</strong> : null}
        {title ? <br /> : null}
        {children}
      </div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <div className="se-steps">{children}</div>;
}

export function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="se-step">
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="se-card-grid">{children}</div>;
}

export function Card({
  href,
  eyebrow,
  title,
  children,
}: {
  href: string;
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <a href={href} className="se-card">
      {eyebrow ? <span className="se-card-eyebrow">{eyebrow}</span> : null}
      <span className="se-card-title">{title}</span>
      {children ? <span className="se-card-desc">{children}</span> : null}
      <span className="se-card-arrow">Read →</span>
    </a>
  );
}

export function Pill({
  tone = "default",
  children,
}: {
  tone?: "default" | "accent" | "info" | "warn";
  children: ReactNode;
}) {
  return (
    <span className={`se-pill ${tone === "default" ? "" : `tone-${tone}`}`}>
      <span className="dot" /> {children}
    </span>
  );
}

export function Terminal({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="se-term">
      <div className="se-term-head">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="se-term-title">{title ?? "shell"}</span>
      </div>
      <div className="se-term-body">{children}</div>
    </div>
  );
}

export function Prompt({ children }: { children: ReactNode }) {
  return <span className="se-term-prompt">$</span>;
}

export function Out({ children }: { children: ReactNode }) {
  return <span className="se-term-out">{children}</span>;
}

/* Landing hero — used on the root index */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="se-hero not-prose">
      {eyebrow ? (
        <div className="se-hero-eyebrow">
          <span className="dot" />
          {eyebrow}
        </div>
      ) : null}
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {primaryHref || secondaryHref ? (
        <div className="se-hero-cta">
          {primaryHref ? (
            <a className="se-btn se-btn-primary" href={primaryHref}>
              {primaryLabel ?? "Get started"}
              <span className="arr">→</span>
            </a>
          ) : null}
          {secondaryHref ? (
            <a className="se-btn se-btn-ghost" href={secondaryHref}>
              {secondaryLabel ?? "Read more"}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Quickstart 3-up — header + three steps + optional footer.
   Use as <Quickstart title="…" time="~5 min"><QuickstartStep …/>×3</Quickstart>
   ────────────────────────────────────────────────────────────── */
export function Quickstart({
  title,
  time,
  children,
}: {
  title: string;
  time?: string;
  children: ReactNode;
}) {
  return (
    <div className="se-quickstart not-prose">
      <div className="se-qs-head">
        <span className="se-qs-num">▶</span>
        <h3>{title}</h3>
        {time ? <span className="se-qs-time">{time}</span> : null}
      </div>
      <div className="se-qs-grid">{children}</div>
    </div>
  );
}

export function QuickstartStep({
  num,
  label,
  title,
  cmd,
  children,
}: {
  num: number | string;
  label: string;
  title: string;
  cmd?: string;
  children?: ReactNode;
}) {
  const numStr = String(num).padStart(2, "0");
  return (
    <div className="se-qs-step">
      <span className="se-qs-k">
        {numStr} · {label}
      </span>
      <h4>{title}</h4>
      {children ? <p>{children}</p> : null}
      {cmd ? (
        <div className="se-qs-snip">
          <span className="p">$</span>
          <span>{cmd}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Install tabs — pkg-manager command picker. Tabs are static here;
   the active tab is interactive in <InstallTabsClient/>.
   ────────────────────────────────────────────────────────────── */
export function InstallTabs({
  npm,
  pnpm,
  yarn,
  bun,
}: {
  npm: string;
  pnpm?: string;
  yarn?: string;
  bun?: string;
}) {
  const cmds = {
    npm,
    pnpm: pnpm ?? npm.replace(/^npm install/, "pnpm add").replace(/^npm i\b/, "pnpm add"),
    yarn: yarn ?? npm.replace(/^npm install/, "yarn add").replace(/^npm i\b/, "yarn add"),
    bun: bun ?? npm.replace(/^npm install/, "bun add").replace(/^npm i\b/, "bun add"),
  };
  return <InstallTabsClient cmds={cmds} />;
}

/* ──────────────────────────────────────────────────────────────
   API reference table.
   Use:
     <ApiTable>
       <ApiRow name="source" required type="Locale" desc="…" />
       <ApiRow name="targets" type="Locale[]" desc="…" />
     </ApiTable>
   ────────────────────────────────────────────────────────────── */
export function ApiTable({ children }: { children: ReactNode }) {
  return (
    <div className="se-api-table not-prose">
      <div className="se-api-row head">
        <div>Field</div>
        <div>Type</div>
        <div>Description</div>
      </div>
      {children}
    </div>
  );
}

export function ApiRow({
  name,
  type,
  required,
  optional,
  desc,
  children,
}: {
  name: string;
  type: string;
  required?: boolean;
  optional?: boolean;
  desc?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="se-api-row">
      <div className="name">
        {name}
        {required ? <span className="req">required</span> : null}
      </div>
      <div className="type">
        {type}
        {optional ? <span className="opt"> ?</span> : null}
      </div>
      <div className="desc">{desc ?? children}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Concept tile grid (denser than CardGrid; 2-up).
   ────────────────────────────────────────────────────────────── */
export function TileGrid({ children }: { children: ReactNode }) {
  return <div className="se-tile-grid not-prose">{children}</div>;
}

export function Tile({
  href,
  icon,
  title,
  meta,
  children,
}: {
  href: string;
  icon?: string;
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <a className="se-tile" href={href}>
      <span className="ti">{icon ?? "▣"}</span>
      <h4>
        {title}
        <span className="arrow">→</span>
      </h4>
      {children ? <p>{children}</p> : null}
      {meta ? <div className="meta">{meta}</div> : null}
    </a>
  );
}

/* ──────────────────────────────────────────────────────────────
   Convert CTA — bottom-of-page conversion block.
   ────────────────────────────────────────────────────────────── */
export function ConvertCTA({
  eyebrow = "Ready?",
  title,
  body,
  primaryHref,
  primaryLabel = "Get started",
  secondaryHref,
  secondaryLabel,
  cmds,
  note,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  cmds?: { label: string; cmd: string }[];
  note?: ReactNode;
}) {
  return (
    <div className="se-convert not-prose">
      <div className="se-conv-grid">
        <div className="se-conv-l">
          <div className="e">▲ {eyebrow}</div>
          <h3>{title}</h3>
          {body ? <p>{body}</p> : null}
          <div className="row">
            {primaryHref ? (
              <a className="se-btn se-btn-primary" href={primaryHref}>
                {primaryLabel} <span className="arr">→</span>
              </a>
            ) : null}
            {secondaryHref ? (
              <a className="se-btn se-btn-ghost" href={secondaryHref}>
                {secondaryLabel ?? "Read more"}
              </a>
            ) : null}
          </div>
        </div>
        <div className="se-conv-r">
          {(cmds ?? []).map((c, i) => (
            <div key={i}>
              <div className="lab">{c.label}</div>
              <div className="se-conv-r-cmd">
                <span className="p">$</span>
                <span>{c.cmd}</span>
              </div>
            </div>
          ))}
          {note ? (
            <div
              style={{
                fontFamily: "var(--se-mono)",
                fontSize: "10.5px",
                color: "var(--se-fg-4)",
                marginTop: "4px",
                lineHeight: 1.6,
              }}
            >
              {note}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Doc nav (prev / next) and feedback footer.
   ────────────────────────────────────────────────────────────── */
export function DocNav({
  prev,
  next,
}: {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
}) {
  return (
    <nav className="se-doc-nav not-prose">
      {prev ? (
        <a href={prev.href} className="prev">
          <div className="lab">← Previous</div>
          <div className="ti">{prev.title}</div>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={next.href} className="next">
          <div className="lab">Next →</div>
          <div className="ti">{next.title}</div>
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function DocFeedback({ editHref }: { editHref?: string }) {
  return (
    <div className="se-feedback not-prose">
      <span className="q">Was this page helpful?</span>
      <button type="button">👍 Yes</button>
      <button type="button">👎 Not quite</button>
      {editHref ? (
        <a
          href={editHref}
          style={{
            marginLeft: "auto",
            color: "var(--se-fg-3)",
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          ✎ Edit on GitHub
        </a>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Doc meta row — pill + read time + updated date.
   ────────────────────────────────────────────────────────────── */
export function DocMeta({
  status = "Production ready",
  read,
  updated,
  works,
}: {
  status?: string;
  read?: string;
  updated?: string;
  works?: string;
}) {
  return (
    <div className="se-doc-meta not-prose">
      <span className="pill">
        <span className="d" />
        {status}
      </span>
      {read ? (
        <span className="item">
          On this page · <b>{read}</b>
        </span>
      ) : null}
      {updated ? (
        <span className="item">
          Updated · <b>{updated}</b>
        </span>
      ) : null}
      {works ? (
        <span className="item">
          Works with · <b>{works}</b>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Compact 2×2 picker for "which Flags & Experiments primitive should I use?".
 * Each cell answers a single question — no nested decision tree, no mermaid.
 */
export function DecisionPicker() {
  const cells: {
    href: string;
    q: string;
    name: string;
    tag: string;
    body: string;
  }[] = [
    {
      href: "/flags-experiments/gates",
      q: "if / else by user?",
      name: "Gate",
      tag: "boolean",
      body: "Targeting rules + percentage rollout. The default tool for shipping behind a flag.",
    },
    {
      href: "/flags-experiments/configs",
      q: "what value?",
      name: "Config",
      tag: "typed",
      body: "String, number, boolean, JSON — schema-validated. Change without a redeploy.",
    },
    {
      href: "/flags-experiments/killswitches",
      q: "kill it now?",
      name: "Killswitch",
      tag: "incident",
      body: "One switch, no rollout %. The lever you pull at 3am during an incident.",
    },
    {
      href: "/flags-experiments/experiments",
      q: "is X better than Y?",
      name: "Experiment",
      tag: "stats",
      body: "A/B test with automated p-values + 95% confidence intervals. Daily updates.",
    },
  ];
  return (
    <div className="se-picker not-prose">
      {cells.map((c) => (
        <a key={c.href} href={c.href} className="se-picker-cell">
          <span className="q">{c.q}</span>
          <span className="row">
            <span className="name">{c.name}</span>
            <span className="tag">{c.tag}</span>
          </span>
          <span className="body">{c.body}</span>
          <span className="arrow" aria-hidden>
            →
          </span>
        </a>
      ))}
    </div>
  );
}
