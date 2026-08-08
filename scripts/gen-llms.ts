#!/usr/bin/env tsx
/**
 * Regenerates the agent-facing bundles: the machine-readable text endpoints and
 * the human page that documents them.
 *
 *   pnpm gen:llms
 *
 * Everything here is stitched from `content/docs` — no prose is authored in
 * this script. That is the whole point: an agent reading `llms-full.txt` is
 * reading the same sentences the site shows, so the two cannot disagree, and a
 * docs edit updates the agent surface for free.
 *
 * Four outputs:
 *
 *   llms.txt       the index — every page, one line each, per the llms.txt
 *                  convention. Small enough to always fetch first.
 *   llms-full.txt  the whole documentation, in nav order.
 *   agents.md      the setup runbook — the install/auth/wire-it-up path,
 *                  stitched in the order you'd actually do it, then a
 *                  reference appendix (every CLI command, every MCP tool).
 *   get-started/llms.mdx  the page that tells a human these exist.
 *
 * The per-operation API reference and the per-language SDK reference are
 * indexed but NOT inlined — 200-odd pages of generated schema tables would
 * bury the prose, and an agent that needs one can fetch that page. Both are
 * listed in llms.txt with their URLs.
 *
 * Output is committed under `generated/`, then mirrored by
 * `scripts/sync-generated.ts`. See generated/README.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listRoutes, loadCorpus, type Page } from "./lib/corpus";
import { mdxToText } from "./lib/mdx-text";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT = join(ROOT, "content/docs");
const GEN_PUBLIC = join(ROOT, "generated/public");
const GEN_PAGE = join(ROOT, "generated/content/get-started/llms.mdx");
const BASE = "https://docs.shipeasy.ai";

/** Reference trees that are indexed by URL rather than inlined. */
const NOT_INLINED = ["api/operations", "sdks/reference"];

/**
 * Command prefixes kept out of the reference appendix. `cli-commands.json`
 * deliberately holds the WHOLE Commander tree — it is what `<Cmd>` validates
 * prose against — so the products hidden from the docs have to be filtered
 * here, exactly as the marketplace generator filters them out of
 * `cli-reference.mdx`. The MCP list needs no equivalent: it is read back out of
 * the already-filtered reference page. See content/_hidden/README.md.
 */
const HIDDEN_CLI = [
  "shipeasy release experiments",
  "shipeasy metrics experiments",
  "shipeasy i18n",
];

/**
 * The setup path, in the order someone actually walks it. Hand-ordered
 * deliberately — the nav groups these by topic, but an agent wiring up a repo
 * needs install before keys before a first flag, and no meta.json expresses
 * that. Every entry is a real route; a typo fails the build below.
 */
const SETUP_PATH = [
  "/get-started/install",
  "/get-started/authenticate",
  "/get-started/keys-and-environments",
  "/get-started/quickstart",
  "/get-started/agents",
  "/get-started/mcp",
  "/get-started/cli",
  "/flags/gates/quickstart",
  "/flags/configs/quickstart",
  "/flags/killswitches/quickstart",
  "/metrics/quickstart",
  "/feedback/getting-started",
  "/get-started/triggers",
  "/get-started/troubleshooting",
];

// The bundles stitch the mirrored tree, not `generated/` — the CLI and MCP
// reference only exist under content/docs once sync has run.
if (!existsSync(join(CONTENT, "get-started/mcp-reference.mdx"))) {
  console.error("gen:llms: the CLI/MCP reference is missing — run `pnpm sync` first.");
  process.exit(1);
}

/**
 * The page this script also writes is left OUT of the bundles it stitches. It
 * only describes them — and including it would make the corpus depend on its
 * own byte count, so a regeneration could never settle.
 */
const SELF = "/get-started/llms";

const pages = loadCorpus(CONTENT, NOT_INLINED).filter((p) => p.route !== SELF);
const byRoute = new Map(pages.map((p) => [p.route, p]));

const missing = SETUP_PATH.filter((r) => !byRoute.has(r));
if (missing.length) {
  console.error(
    `gen:llms: SETUP_PATH names ${missing.length} route(s) that no longer exist:\n` +
      missing.map((r) => `  ${r}`).join("\n") +
      `\n\nA page moved. Fix the list in scripts/gen-llms.ts.`,
  );
  process.exit(1);
}

/**
 * Site-relative links are useless to something reading a downloaded file, so
 * every `](/x)` becomes an absolute URL. The reader can then fetch a
 * cross-reference without knowing where the bundle came from.
 */
function absolutise(text: string): string {
  return text.replace(/\]\((\/[^)\s]*)\)/g, (_, path: string) => `](${BASE}${path})`);
}

/**
 * Five pages are called "Quickstart". In the nav their parent disambiguates
 * them; in a flat bundle a bare heading does not, so anything ambiguous gets
 * its section qualified.
 */
const titleCount = new Map<string, number>();
for (const p of pages) titleCount.set(p.title, (titleCount.get(p.title) ?? 0) + 1);

function heading(p: Page): string {
  if ((titleCount.get(p.title) ?? 0) < 2) return p.title;
  const parent = p.route.split("/").filter(Boolean).slice(0, -1).join("/");
  return parent ? `${p.title} (${parent})` : p.title;
}

/** One page, rendered for a stitched bundle. */
function section(p: Page): string {
  const url = `${BASE}${p.route === "/" ? "" : p.route}`;
  const head = [`# ${heading(p)}`, ``, `Source: ${url}`];
  if (p.description) head.push(``, p.description);
  return `${head.join("\n")}\n\n${absolutise(mdxToText(p.body))}\n`;
}

/** Demote a stitched page's own headings so the bundle keeps one hierarchy. */
function demote(text: string): string {
  return text.replace(/^(#{1,5}) /gm, "$1# ").replace(/^#{7,} /gm, "###### ");
}

const stamp = `Generated from ${BASE} — do not edit by hand. Regenerate with \`pnpm gen:llms\`.`;

/* ------------------------------------------------------------------ llms.txt */

const tabs = new Map<string, Page[]>();
for (const p of pages) {
  const key = p.tabTitle || "Home";
  if (!tabs.has(key)) tabs.set(key, []);
  tabs.get(key)!.push(p);
}

const indexParts: string[] = [
  `# Shipeasy`,
  ``,
  `> Feature flags, dynamic configs, kill switches, product metrics, alerts and an ops queue — evaluated locally in your process, changed from a dashboard, a CLI, an MCP server or an AI agent.`,
  ``,
  stamp,
  ``,
  `## Start here`,
  ``,
  `- [Setup runbook](${BASE}/agents.md): the install-to-first-flag path, stitched end to end, with every CLI command and MCP tool listed at the bottom`,
  `- [Full documentation](${BASE}/llms-full.txt): every page below, in one file`,
  ``,
];

for (const [tab, list] of tabs) {
  indexParts.push(`## ${tab}`, ``);
  for (const p of list) {
    const url = `${BASE}${p.route === "/" ? "" : p.route}`;
    indexParts.push(`- [${heading(p)}](${url})${p.description ? `: ${p.description}` : ""}`);
  }
  indexParts.push(``);
}

indexParts.push(`## Reference (not inlined in llms-full.txt)`, ``);
for (const dir of NOT_INLINED) {
  for (const r of listRoutes(CONTENT, join(CONTENT, dir))) {
    indexParts.push(`- [${r.title}](${BASE}${r.route})`);
  }
}
indexParts.push(``);

/* ------------------------------------------------------------- llms-full.txt */

const fullParts: string[] = [
  `# Shipeasy documentation`,
  ``,
  stamp,
  ``,
  `Every authored page plus the generated CLI and MCP reference, in the site's own`,
  `navigation order. The per-operation API reference and the per-language SDK`,
  `reference are indexed in ${BASE}/llms.txt and served page by page.`,
  ``,
  `---`,
  ``,
];
for (const p of pages) fullParts.push(demote(section(p)), `---`, ``);

/* ------------------------------------------------------------------ agents.md */

const allCommands = (
  JSON.parse(readFileSync(join(ROOT, "src/lib/cli-commands.json"), "utf8")) as {
    commands: { path: string; options?: string[] }[];
  }
).commands;

const cliCommands = allCommands.filter(
  (c) => !HIDDEN_CLI.some((h) => c.path === h || c.path.startsWith(`${h} `)),
);

const mcpTools = [
  ...new Set(
    [
      ...readFileSync(join(CONTENT, "get-started/mcp-reference.mdx"), "utf8").matchAll(
        /^#{3,4} `([a-z][a-z0-9_]*)`$/gm,
      ),
    ].map((m) => m[1]),
  ),
];

if (!cliCommands.length || !mcpTools.length) {
  console.error(
    `gen:llms: extracted ${cliCommands.length} CLI commands and ${mcpTools.length} MCP ` +
      `tools — one of the generated references changed shape.`,
  );
  process.exit(1);
}

const setupParts: string[] = [
  `# Shipeasy — setup runbook for coding agents`,
  ``,
  stamp,
  ``,
  `Read this top to bottom to take a repo from nothing to a flag serving traffic,`,
  `metrics recording, and alerts wired. Each part below is a documentation page,`,
  `reproduced whole, ordered the way the work is actually done rather than the way`,
  `the nav groups it. The source URL is on every part.`,
  ``,
  `If you only need one thing, jump by heading. If you need something not covered`,
  `here, the index at ${BASE}/llms.txt lists every page, and`,
  `${BASE}/llms-full.txt is the whole corpus in one file.`,
  ``,
  `## Contents`,
  ``,
  ...SETUP_PATH.map((r, i) => `${i + 1}. ${heading(byRoute.get(r)!)} — ${BASE}${r}`),
  ``,
  `---`,
  ``,
];
for (const r of SETUP_PATH) setupParts.push(demote(section(byRoute.get(r)!)), `---`, ``);

setupParts.push(
  `# Reference`,
  ``,
  `## Every CLI command`,
  ``,
  `Full flags and arguments: ${BASE}/get-started/cli-reference`,
  ``,
  ...cliCommands.map(
    (c) => `- \`${c.path}\`${c.options?.length ? ` — ${c.options.join(" ")}` : ""}`,
  ),
  ``,
  `## Every MCP tool`,
  ``,
  `Parameters and error codes: ${BASE}/get-started/mcp-reference`,
  ``,
  ...mcpTools.map((t) => `- \`${t}\``),
  ``,
  `## Every documentation page`,
  ``,
  ...pages.map((p) => `- ${heading(p)} — ${BASE}${p.route === "/" ? "" : p.route}`),
  ``,
);

/* --------------------------------------------------------------- the MDX page */

const endpoints = [
  ["/llms.txt", "Index", "Every page with its one-line description. Fetch this first"],
  ["/llms-full.txt", "Full corpus", "The whole documentation in one file, in nav order"],
  ["/agents.md", "Setup runbook", "Install to first flag, then a full CLI + MCP reference"],
] as const;

const page = `---
title: Docs for agents
description: Machine-readable bundles of this documentation — an index, the full corpus, and a setup runbook — regenerated from the same pages you are reading.
---

<Callout type="info" title="This page is generated">
  So are the three files it describes. They are stitched from \`content/docs\` on every
  regeneration, which is why they cannot drift from the pages you are reading
</Callout>

Point a coding agent at one of these instead of asking it to crawl the site. All three are plain text served from the docs root, need no auth, and are rebuilt whenever the documentation changes.

| Endpoint | What it is | Size |
| --- | --- | --- |
${endpoints
  .map(([path, name, what]) => `| [\`${path}\`](${path}) | **${name}** — ${what} | %%${path}%% |`)
  .join("\n")}

## Which one

**Wiring Shipeasy into a repo** — [\`/agents.md\`](/agents.md). It is the install → authenticate → keys → first flag → metrics → alerts path stitched in the order the work happens, followed by every CLI command and every MCP tool by name. That appendix is the part worth having in context: a hallucinated command name is the single most common way an agent fails at this.

**Answering questions about Shipeasy** — [\`/llms.txt\`](/llms.txt) first, then fetch the one or two pages it points at. Cheaper and sharper than loading the corpus.

**Bulk ingestion** — [\`/llms-full.txt\`](/llms-full.txt), ${pages.length} pages in one request.

## What is not in them

The ${listRoutes(CONTENT, join(CONTENT, "api/operations")).length} per-operation [API reference](/api) pages and the ${listRoutes(CONTENT, join(CONTENT, "sdks/reference")).length} per-language [SDK reference](/sdks) pages are **indexed in \`llms.txt\` but not inlined** — they are generated schema tables, and inlining them would bury the prose. Fetch the page you need, or read the [OpenAPI spec](/api) directly.

## Skip the fetch entirely

If your agent can run MCP, the [\`shipeasy\` server](/get-started/mcp) ships \`docs_list\`, \`docs_get\` and \`docs_skill\` — the same content, retrieved by topic instead of by URL, plus installable skills that already know these workflows. See [Install in your agent](/get-started/agents).

<SeeAlso
  links={[
    {
      href: "/get-started/agents",
      title: "Install in your agent",
      note: "skills + MCP, per host",
    },
    { href: "/get-started/mcp", title: "MCP server", note: "what the tools do" },
    { href: "/get-started/triggers", title: "Agent triggers", note: "let an alert start a run" },
  ]}
/>
`;

/* ------------------------------------------------------------------- write it */

const outputs: [string, string][] = [
  [join(GEN_PUBLIC, "llms.txt"), indexParts.join("\n")],
  [join(GEN_PUBLIC, "llms-full.txt"), fullParts.join("\n")],
  [join(GEN_PUBLIC, "agents.md"), setupParts.join("\n")],
];

const kb = (s: string) => `${Math.round(s.length / 1024).toLocaleString("en-US")} KB`;
const sizes = new Map(outputs.map(([f, body]) => [`/${f.split("/").pop()!}`, kb(body)]));

for (const [file, body] of outputs) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");
}

mkdirSync(dirname(GEN_PAGE), { recursive: true });
writeFileSync(
  GEN_PAGE,
  page.replace(/%%(\/[a-z.-]+)%%/g, (_, p: string) => sizes.get(p) ?? "—"),
);

console.log(
  `gen:llms: ${pages.length} pages stitched — ` +
    outputs.map(([f, b]) => `${f.split("/").pop()} ${kb(b)}`).join(", ") +
    `, ${cliCommands.length}/${allCommands.length} CLI commands, ${mcpTools.length} MCP tools.`,
);
