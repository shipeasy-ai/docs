import type { ReactNode } from "react";
import { InstallTabsClient } from "./install-tabs-client";
import { parseInvocation, referenceHref } from "@/lib/cli-commands";

type Tone = "info" | "success" | "warn" | "danger";

const ICONS: Record<Tone, string> = {
  info: "i",
  success: "✓",
  warn: "!",
  danger: "×",
};

/* ──────────────────────────────────────────────────────────────
   CLI command reference — validated against the real command tree.
   ────────────────────────────────────────────────────────────── */

/**
 * Cite a `shipeasy` CLI command in prose. Renders it as inline code linked to
 * its entry on the generated CLI reference, and — the point of the component —
 * **validates it at build time** against `src/lib/cli-commands.json`, the
 * projection of the CLI's own Commander tree.
 *
 * A command path or `--flag` the CLI doesn't ship throws during `next build`,
 * so a published page can't cite a command the binary doesn't have.
 *
 *   <Cmd cmd="shipeasy release flags create <name>" />
 *   <Cmd cmd="shipeasy release flags update <id> --rollout-percent 25" />
 *
 * Prefer the `cmd` prop: usage strings routinely contain `<name>` placeholders,
 * which MDX would otherwise parse as a JSX tag. Children work for
 * placeholder-free commands. Args and values are free-form — only the command
 * path and long flags are checked. `link={false}` drops the link where it would
 * be noise (in a heading, or on the reference page itself).
 */
export function Cmd({
  cmd,
  children,
  link = true,
}: {
  cmd?: string;
  children?: ReactNode;
  link?: boolean;
}) {
  const source = cmd ?? children;
  if (typeof source !== "string") {
    throw new Error(
      '<Cmd> needs a plain string, e.g. <Cmd cmd="shipeasy release flags list" /> ' +
        `(got ${typeof source})`,
    );
  }
  const { written, command } = parseInvocation(source);
  const code = <code className="se-cmd">{written}</code>;
  if (!link) return code;
  return (
    <a className="se-cmd-link" href={referenceHref(command)}>
      {code}
    </a>
  );
}

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
      {children ? <div className="body">{children}</div> : null}
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
   Tool reference table — a 2-column (name → description) listing for
   MCP tools / CLI commands, where every row is the same kind of thing
   so a "Type" column would just repeat "tool" and "required" is
   meaningless. Reuses the API-table shell with a 2-column modifier.
   Use:
     <ToolTable>
       <ToolRow name="auth_check" desc="Returns the auth + project status." />
     </ToolTable>
   ────────────────────────────────────────────────────────────── */
export function ToolTable({ caption, children }: { caption?: ReactNode; children: ReactNode }) {
  return (
    <div className="se-api-table se-tool-table not-prose">
      <div className="se-api-row head">
        <div>Tool</div>
        <div>What it does</div>
      </div>
      {children}
      {caption ? <div className="se-tool-caption">{caption}</div> : null}
    </div>
  );
}

export function ToolRow({
  name,
  desc,
  children,
}: {
  name: string;
  desc?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="se-api-row">
      <div className="name">
        <span className="id">{name}</span>
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
      {children ? <div className="body">{children}</div> : null}
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
   Feedback footer.
   ────────────────────────────────────────────────────────────── */
// Prev/next page navigation is rendered by Fumadocs' built-in <DocsPage>
// footer (auto-derived from the page tree) — see `lib/doc-page.tsx`. Don't
// re-add a hand-placed DocNav in MDX or it double-renders under the footer.

// The "Was this page helpful?" footer is interactive (beacons votes to the edge
// worker) and lives in its own "use client" module. It's rendered once per page
// by `DocPageView` — not hand-placed in MDX — so it's guaranteed on every page.
export { DocFeedback } from "./doc-feedback";

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

/* ──────────────────────────────────────────────────────────────
   Journey path — an ordered, numbered set of linked steps that
   maps a goal ("ship a flag", "translate my app") to a sequence
   of existing docs pages. Used on the home hub + product indexes.
   Use:
     <JourneyPath
       title="Ship a feature behind a flag"
       steps={[
         { href: "/get-started/install", label: "Install", title: "Add the SDK" },
         { href: "/flags-experiments/gates/quickstart", label: "Create", title: "Your first flag" },
       ]}
     />
   ────────────────────────────────────────────────────────────── */
export function JourneyPath({
  title,
  goal,
  steps,
}: {
  title: string;
  goal?: ReactNode;
  steps: { href: string; label?: string; title: string }[];
}) {
  return (
    <div className="se-journey not-prose">
      <div className="se-journey-head">
        <span className="se-journey-k">▸ Journey</span>
        <h4>{title}</h4>
        {goal ? <p>{goal}</p> : null}
      </div>
      <ol className="se-journey-steps">
        {steps.map((s, i) => (
          <li key={s.href}>
            <a href={s.href}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="t">
                {s.label ? <span className="lab">{s.label}</span> : null}
                <span className="ti">{s.title}</span>
              </span>
              <span className="arr" aria-hidden>
                →
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   See also — compact "Related" link list for the leaf-page footer.
   Lighter than <CardGrid>; pairs with <DocFeedback> above the footer nav.
   Use:
     <SeeAlso links={[
       { href: "/flags-experiments/gates/targeting", title: "Targeting rules" },
       { href: "/get-started/attributes", title: "User attributes", note: "what you can target on" },
     ]} />
   ────────────────────────────────────────────────────────────── */
export function SeeAlso({
  title = "Related",
  links,
}: {
  title?: string;
  links: { href: string; title: string; note?: ReactNode }[];
}) {
  return (
    <div className="se-seealso not-prose">
      <span className="se-seealso-k">{title}</span>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href}>
              <span className="ti">{l.title}</span>
              {l.note ? <span className="note">{l.note}</span> : null}
              <span className="arr" aria-hidden>
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
