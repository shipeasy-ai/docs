#!/usr/bin/env tsx
/**
 * Regenerates the human-readable per-SDK reference under
 * `content/docs/sdks/reference/<lang>/` from each SDK repo's `/docs/` folder.
 *
 * Source of truth: the `/docs/` standard tree committed in each SDK submodule
 * (`packages/server-sdks/sdk-ts/docs`, `packages/server-sdks/sdk-<name>/docs`) — the SAME raw
 * Markdown the `docs` registry op serves over GitHub Pages
 * (`<owner>.github.io/<repo>/…`, see experiment-platform/21 §A4.4). This script
 * just renders that exact content into the central Fumadocs portal so humans
 * get a themed, searchable view of what the op fetches raw.
 *
 * The generated MDX is checked in (the CF docs build does not regenerate). Run:
 *   pnpm --filter @shipeasy/docs gen-sdk-reference
 * CI may re-run and assert no diff to catch drift from the SDK repos.
 */
import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const SDKS_ROOT = join(__dirname, "../content/docs/sdks");
const OUT_ROOT = join(SDKS_ROOT, "reference");

interface Sdk {
  /** reference sub-route: content/docs/sdks/reference/<slug>/ */
  slug: string;
  /** display name in the reference nav */
  name: string;
  /** path (from the repo root) to the SDK repo's docs/ folder */
  docs: string;
  /** the published GitHub Pages base the docs op fetches from */
  pages: string;
  /** docs-site landing page: content/docs/sdks/<landing>.mdx */
  landing: string;
  /** landing page <title> — the label already used in the SDKs nav */
  landingTitle: string;
  /** landing page description — site metadata, not SDK content */
  blurb: string;
  /** landing page DocMeta "Works with" */
  works: string;
}

// lang slug → { display name, path to the repo's docs/ folder, the published
// GitHub Pages base the docs op fetches from, and the docs-site landing page
// generated from that repo's overview }
const SDKS: Sdk[] = [
  {
    slug: "typescript",
    name: "TypeScript / JavaScript",
    docs: "packages/server-sdks/sdk-ts/docs",
    pages: "https://shipeasy-ai.github.io/sdk-ts",
    landing: "node-typescript",
    landingTitle: "Node / TypeScript",
    blurb:
      "The canonical Shipeasy SDK — one package with a server and a browser build, local evaluation, configs, experiments, and tracking.",
    works: "Node 18+ · Cloudflare Workers · Deno · Next.js · Browsers",
  },
  {
    slug: "python",
    name: "Python",
    docs: "packages/server-sdks/sdk-python/docs",
    pages: "https://shipeasy-ai.github.io/sdk-python",
    landing: "python",
    landingTitle: "Python",
    blurb:
      "The Shipeasy Python server SDK — local evaluation, configs, experiments, WSGI/ASGI anon middleware, and metric tracking.",
    works: "Python 3.8+ · Django · Flask · FastAPI",
  },
  {
    slug: "go",
    name: "Go",
    docs: "packages/server-sdks/sdk-go/docs",
    pages: "https://shipeasy-ai.github.io/sdk-go",
    landing: "go",
    landingTitle: "Go",
    blurb:
      "The Shipeasy Go server SDK — context-aware client, local evaluation, configs, experiments, and metric tracking.",
    works: "Go 1.21+",
  },
  {
    slug: "java",
    name: "Java",
    docs: "packages/server-sdks/sdk-java/docs",
    pages: "https://shipeasy-ai.github.io/sdk-java",
    landing: "java",
    landingTitle: "Java",
    blurb:
      "The Shipeasy Java server SDK — configure once, bind a Client per request, servlet anon filter, local evaluation, configs, experiments, and tracking.",
    works: "Java 17+ · Maven · Gradle",
  },
  {
    slug: "kotlin",
    name: "Kotlin",
    docs: "packages/server-sdks/sdk-kotlin/docs",
    pages: "https://shipeasy-ai.github.io/sdk-kotlin",
    landing: "kotlin",
    landingTitle: "Kotlin",
    blurb:
      "The Shipeasy Kotlin SDK — pure-JVM core plus an Android client artifact, local evaluation, configs, experiments, and tracking.",
    works: "JDK 17+ · Android minSdk 26+ · Gradle · Maven",
  },
  {
    slug: "php",
    name: "PHP",
    docs: "packages/server-sdks/sdk-php/docs",
    pages: "https://shipeasy-ai.github.io/sdk-php",
    landing: "php",
    landingTitle: "PHP",
    blurb:
      "The Shipeasy PHP server SDK — PHP-FPM friendly per-request init, local evaluation, configs, experiments, and tracking.",
    works: "PHP 8.1+ · Composer · Laravel · Symfony · WordPress",
  },
  {
    slug: "swift",
    name: "Swift",
    docs: "packages/server-sdks/sdk-swift/docs",
    pages: "https://shipeasy-ai.github.io/sdk-swift",
    landing: "swift",
    landingTitle: "Swift",
    blurb:
      "The Shipeasy Swift SDK — a native client SDK on SwiftPM, authenticating with the public client key, for flags, configs, experiments, and tracking.",
    works: "iOS 15+ · macOS 12+ · tvOS 15+ · watchOS 8+ · SwiftPM",
  },
  {
    slug: "ruby",
    name: "Ruby",
    docs: "packages/server-sdks/sdk-ruby/docs",
    pages: "https://shipeasy-ai.github.io/sdk-ruby",
    landing: "ruby",
    landingTitle: "Ruby",
    blurb:
      "The Shipeasy Ruby gem — fork-safe singleton, Rails railtie, local evaluation, configs, experiments, and tracking.",
    works: "Ruby 3.0+ · Rails · Sinatra · Rack",
  },
];

// The fixed feature-page vocabulary (manifest key → nav title), in nav order.
// `overview` is emitted as the folder's index.mdx.
const PAGE_TITLES: Record<string, string> = {
  overview: "Overview",
  installation: "Installation",
  configuration: "Configuration",
  flags: "Feature flags",
  configs: "Dynamic configs",
  killswitches: "Kill switches",
  experiments: "Experiments",
  i18n: "Internationalization (i18n)",
  "error-reporting": "Error reporting",
  testing: "Testing",
  openfeature: "OpenFeature",
  advanced: "Advanced",
  "admin-api": "Admin API client",
};
const PAGE_ORDER = Object.keys(PAGE_TITLES);

interface Manifest {
  sdk: string;
  pages: Record<string, string>;
  snippets: Record<string, Record<string, string>>;
  skill?: string;
  placeholders?: string[];
}

// The SDK docs carry `{{PLACEHOLDER}}` tokens that the `docs get` op fills from
// the caller's own resource names. The docs site has no caller, so bake in the
// same worked example every page already tells its story with.
const EXAMPLE_VALUES: Record<string, string> = {
  FLAG_KEY: "new_checkout",
  CONFIG_KEY: "billing_copy",
  KILLSWITCH_KEY: "payments",
  EXPERIMENT_KEY: "hero_cta",
  EVENT_NAME: "checkout_started",
  SUCCESS_EVENT: "purchase",
  RESOURCE_NAME: "new_checkout",
  PROFILE: "web",
  FRAMEWORK: "express",
};

function substitutePlaceholders(md: string, m: Manifest): string {
  let out = md;
  for (const ph of m.placeholders ?? []) {
    const value = EXAMPLE_VALUES[ph];
    if (value !== undefined) out = out.replaceAll(`{{${ph}}}`, value);
  }
  return out;
}

/** Nav rows (list items / table rows) whose only payload is a link to a page we
 *  do not publish — i18n is hidden from the public docs (2026-07). */
function dropHiddenNavRows(md: string): string {
  return md
    .split("\n")
    .filter(
      (line) => !/^\s*(?:[-*+]|\|)\s*.*\]\((?:\.{1,2}\/)*(?:pages\/)?i18n\.md[^)]*\)/.test(line),
    )
    .join("\n");
}

/**
 * Rewrite the SDK repo's own relative Markdown links onto docs-site routes.
 * Without this every cross-page link in the generated reference 404s (it would
 * resolve to `/sdks/reference/<slug>/installation.md`).
 *
 *   installation.md            → /sdks/reference/<slug>/installation
 *   ./testing.md#seed          → /sdks/reference/<slug>/testing#seed
 *   ../../pages/overview.md    → /sdks/reference/<slug>
 *   ../snippets/metrics/track.md → /sdks/reference/<slug>/snippets#metrics--track
 *
 * A link to a page we deliberately do not publish (i18n) is unlinked — the
 * prose keeps its wording, the dead href goes away.
 */
function rewriteLinks(md: string, slug: string): string {
  const base = `/sdks/reference/${slug}`;
  return md
    .replace(
      /\[([^\]]*)\]\((?:\.{1,2}\/)*snippets\/([a-z0-9-]+)\/([a-z0-9-]+)\.md(#[^)\s]*)?\)/gi,
      (_all, text, group, leaf) => `[${text}](${base}/snippets#${group}--${leaf})`,
    )
    .replace(
      /\[([^\]]*)\]\((?:\.{1,2}\/)*(?:pages\/)?([a-z0-9-]+)\.md(#[^)\s]*)?\)/gi,
      (all, text: string, page: string, hash: string | undefined) => {
        if (page === "i18n") return text; // hidden page — keep the words, drop the link
        if (!PAGE_TITLES[page]) return all; // not a page we publish — leave as-is
        const href = page === "overview" ? base : `${base}/${page}`;
        return `[${text}](${href}${hash ?? ""})`;
      },
    );
}

/** Last commit date of the SDK repo's docs/ folder, as "June 18, 2026". */
function docsUpdated(docsDir: string): string | undefined {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", "."], {
      cwd: join(REPO_ROOT, docsDir),
      encoding: "utf8",
    }).trim();
    if (!iso) return undefined;
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return undefined; // submodule without git metadata — omit the row
  }
}

/** The first fenced block of an SDK's installation page is, by the /docs/
 *  standard, its install command — lift it verbatim (fence + info string). */
function firstCodeBlock(md: string): string | undefined {
  return md.match(/^```[^\n]*\n[\s\S]*?^```/m)?.[0];
}

/** Splice a section in ahead of the body's first `##` heading — i.e. straight
 *  after the intro paragraph, before "Quickstart". */
function insertBeforeFirstHeading(body: string, section: string): string {
  const lines = body.split("\n");
  const at = lines.findIndex((l) => /^##\s/.test(l));
  if (at === -1) return `${body.trimEnd()}\n\n${section}`;
  return [...lines.slice(0, at), section, ...lines.slice(at)].join("\n");
}

/** ~200 wpm, prose + code, rounded up. */
function readTime(md: string): string {
  return `${Math.max(1, Math.round(md.split(/\s+/).length / 200))} min read`;
}

/** Make Markdown safe to compile as MDX: escape `{ } <` in prose, leaving
 *  fenced and inline code verbatim (MDX does not parse those). */
function mdxEscape(md: string): string {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((block, i) => {
      if (i % 2 === 1) return block; // fenced code — verbatim
      return block
        .split(/(`[^`\n]*`)/g)
        .map((seg, j) =>
          j % 2 === 1
            ? seg // inline code — verbatim
            : seg.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/</g, "&lt;"),
        )
        .join("");
    })
    .join("");
}

/** First H1 → title; first following paragraph → plain-text description. */
function splitHeading(md: string): { title?: string; body: string; description?: string } {
  const lines = md.split("\n");
  let title: string | undefined;
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m) {
      title = m[1];
      start = i + 1;
      break;
    }
    if (lines[i].trim() !== "") break; // content before any H1 — leave as-is
  }
  const body = lines.slice(start).join("\n").replace(/^\n+/, "");
  const para = body.split(/\n\s*\n/).find((p) => p.trim() && !p.startsWith("#"));
  return { title, body, description: para ? toPlain(para) : undefined };
}

function toPlain(s: string): string {
  const p = s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[(.+?)\]\([^)]*\)/g, "$1")
    .replace(/[*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return p.length <= 160 ? p : `${p.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}

function frontmatter(title: string, description?: string): string {
  const d = description ? `\ndescription: ${JSON.stringify(description)}` : "";
  return `---\ntitle: ${JSON.stringify(title)}${d}\n---\n\n`;
}

function read(docsDir: string, rel: string): string {
  return readFileSync(join(REPO_ROOT, docsDir, rel), "utf8");
}

/** Repo Markdown → docs-site MDX: fill placeholders, drop hidden nav rows,
 *  point relative links at docs-site routes, escape the MDX metacharacters. */
function prepare(raw: string, m: Manifest, slug: string): string {
  return mdxEscape(rewriteLinks(dropHiddenNavRows(substitutePlaceholders(raw, m)), slug));
}

function emitPage(
  outDir: string,
  fileBase: string,
  navTitle: string,
  raw: string,
  sourceUrl: string,
  m: Manifest,
  slug: string,
) {
  const { title, body, description } = splitHeading(substitutePlaceholders(raw, m));
  const fm = frontmatter(title ?? navTitle, description);
  const banner = `<Callout type="info">Generated from the SDK's own \`/docs/\` — also served raw at [\`${sourceUrl}\`](${sourceUrl}).</Callout>\n\n`;
  writeFileSync(join(outDir, `${fileBase}.mdx`), fm + banner + prepare(body, m, slug) + "\n");
}

function emitSnippets(outDir: string, m: Manifest, docsDir: string, slug: string) {
  let body =
    "Minimal copy-paste blocks, grouped by the registry taxonomy. These are the same leaves the `docs get` op returns.\n\n";
  for (const [group, leaves] of Object.entries(m.snippets ?? {})) {
    if (/i18n/i.test(group)) continue; // i18n hidden from public docs (2026-07)
    body += `## ${group}\n\n`;
    for (const [leaf, rel] of Object.entries(leaves)) {
      const { body: sb } = splitHeading(read(docsDir, rel));
      body += `### ${group} / ${leaf}\n\n${prepare(sb.trim(), m, slug)}\n\n`;
    }
  }
  writeFileSync(
    join(outDir, "snippets.mdx"),
    frontmatter(
      "Snippets",
      "Minimal copy-paste blocks for flags, configs, kill switches and experiments.",
    ) + body,
  );
}

function emitSkill(outDir: string, m: Manifest, docsDir: string, name: string) {
  if (!m.skill) return;
  const raw = read(docsDir, m.skill);
  // Render the skill verbatim inside a fenced block so its YAML frontmatter is
  // visible and copy-pasteable (it installs frontmatter-included). The skill
  // body itself contains ```fenced``` examples, so the wrapper fence must be
  // longer than the longest backtick run inside it — otherwise it closes early
  // and the tail leaks out as raw MDX (e.g. `<https://…>` autolinks parsed as
  // JSX), breaking the build.
  const longestRun = Math.max(0, ...(raw.match(/`+/g) ?? []).map((s) => s.length));
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  const fenced = fence + "markdown\n" + raw.replace(/\n$/, "") + "\n" + fence + "\n";
  const body =
    `An installable agent skill for the ${name} SDK. Fetch it with \`shipeasy docs skill --sdk ${m.sdk}\` ` +
    `(\`--install\` writes it to your agent skills dir), or copy it below — the YAML frontmatter installs with it.\n\n` +
    fenced;
  writeFileSync(
    join(outDir, "skill.mdx"),
    frontmatter(
      "Agent skill",
      `Installable LLM skill for the ${name} SDK (configure() + Client(user), evaluate, experiment + track, testing).`,
    ) + body,
  );
}

// Landing-page "essentials" — the snippet leaves worth inlining on the language
// page, under human headings. The rest of the taxonomy (ops/see, i18n) stays one
// click away on the reference's snippets page rather than doubling this page.
const LANDING_SNIPPETS: { group: string; leaf: string; title: string }[] = [
  { group: "release", leaf: "flags", title: "Feature flags" },
  { group: "release", leaf: "configs", title: "Dynamic configs" },
  { group: "release", leaf: "killswitches", title: "Kill switches" },
  { group: "release", leaf: "experiments", title: "Experiments" },
  { group: "metrics", leaf: "track", title: "Track a conversion" },
];

/**
 * The docs-site language page (`/sdks/<landing>`), generated from the SDK repo's
 * own `overview` page plus its copy-paste snippets. These used to be
 * hand-written and drifted badly from the shipped API — sourcing them from the
 * repo docs is the whole point.
 */
function emitLanding(sdk: Sdk, m: Manifest, docsDir: string) {
  const overviewRel = m.pages.overview;
  if (!overviewRel) throw new Error(`${sdk.slug}: manifest has no 'overview' page`);
  const { body } = splitHeading(substitutePlaceholders(read(docsDir, overviewRel), m));

  // `##` per primitive so each snippet's own `###` sub-headings nest under it.
  let essentials = "";
  for (const { group, leaf, title } of LANDING_SNIPPETS) {
    const rel = m.snippets?.[group]?.[leaf];
    if (!rel) continue;
    const { body: sb } = splitHeading(read(docsDir, rel));
    essentials += `## ${title}\n\n${prepare(sb.trim(), m, sdk.slug)}\n\n`;
  }

  // The overview links out to Installation rather than repeating the command —
  // fine in the repo, a dead end on a landing page. Splice it back in.
  const installRel = m.pages.installation;
  const install = installRel ? firstCodeBlock(read(docsDir, installRel)) : undefined;
  const withInstall = install
    ? insertBeforeFirstHeading(
        body,
        `## Install\n\n${install}\n\nFull wiring — frameworks, options, env vars — is in [Installation](/sdks/reference/${sdk.slug}/installation).\n`,
      )
    : body;

  const page =
    prepare(withInstall, m, sdk.slug).trim() +
    (essentials
      ? `\n\nThe blocks below are the SDK repo's own snippets — the same ones ` +
        `\`shipeasy docs get --sdk ${m.sdk} release/flags\` returns, with a worked example baked in.\n\n${essentials}`
      : "\n\n");

  const meta = `<DocMeta status="Production ready" read=${JSON.stringify(readTime(page))}${
    docsUpdated(docsDir) ? ` updated=${JSON.stringify(docsUpdated(docsDir))}` : ""
  } works=${JSON.stringify(sdk.works)} />\n\n`;

  const banner =
    `<Callout type="info">Generated from the ${sdk.name} SDK repo's own \`/docs/\` — the same Markdown ` +
    `\`shipeasy docs get --sdk ${m.sdk} overview\` returns, served raw at [\`${sdk.pages}\`](${sdk.pages}). ` +
    `Edit it in the SDK repo, not here.</Callout>\n\n`;

  const seeAlso =
    `\n<SeeAlso\n  links={[\n` +
    `    { href: "/sdks/reference/${sdk.slug}", title: "${sdk.name} full reference", note: "Every feature page" },\n` +
    `    { href: "/sdks", title: "Shared evaluation model", note: "How every SDK buckets" },\n` +
    `    { href: "/sdks/reference/${sdk.slug}/testing", title: "Testing", note: "Seed values, zero network" },\n` +
    `    { href: "/sdks/reference/${sdk.slug}/error-reporting", title: "Error reporting", note: "The see() surface" },\n` +
    `  ]}\n/>\n`;

  writeFileSync(
    join(SDKS_ROOT, `${sdk.landing}.mdx`),
    frontmatter(sdk.landingTitle, sdk.blurb) + meta + banner + page.trimEnd() + "\n" + seeAlso,
  );
}

function main() {
  rmSync(OUT_ROOT, { recursive: true, force: true });
  mkdirSync(OUT_ROOT, { recursive: true });

  for (const sdk of SDKS) {
    const docsDir = sdk.docs;
    const manifestPath = join(REPO_ROOT, docsDir, "manifest.json");
    if (!existsSync(manifestPath)) {
      throw new Error(
        `Missing ${manifestPath} — is the ${sdk.slug} submodule checked out with its docs/?`,
      );
    }
    const m: Manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const outDir = join(OUT_ROOT, sdk.slug);
    mkdirSync(outDir, { recursive: true });

    const navPages: string[] = [];
    for (const key of PAGE_ORDER) {
      // i18n is hidden from all public surfaces (2026-07 pricing restructure) —
      // skip its reference page; the SDK's raw GitHub Pages docs keep it.
      if (key === "i18n") continue;
      const rel = m.pages[key];
      if (!rel) continue;
      const fileBase = key === "overview" ? "index" : key;
      emitPage(
        outDir,
        fileBase,
        PAGE_TITLES[key],
        read(docsDir, rel),
        `${sdk.pages}/${rel}`,
        m,
        sdk.slug,
      );
      if (key !== "overview") navPages.push(fileBase);
    }
    emitSnippets(outDir, m, docsDir, sdk.slug);
    emitSkill(outDir, m, docsDir, sdk.name);
    emitLanding(sdk, m, docsDir);

    const langMeta = {
      title: sdk.name,
      pages: ["index", ...navPages, "---More---", "snippets", ...(m.skill ? ["skill"] : [])],
    };
    writeFileSync(join(outDir, "meta.json"), JSON.stringify(langMeta, null, 2) + "\n");
    console.log(
      `✓ ${sdk.slug}: ${navPages.length + 1} pages + snippets${m.skill ? " + skill" : ""} → /sdks/${sdk.landing}`,
    );
  }

  // Reference section index + nav.
  const rows = SDKS.map(
    (s) =>
      `| [${s.name}](/sdks/reference/${s.slug}) | \`${s.slug}\` | [Pages](${s.pages}/manifest.json) |`,
  ).join("\n");
  const indexBody =
    "Per-SDK feature reference, generated from each SDK repo's own `/docs/` folder — the exact Markdown the `docs` registry op serves raw over GitHub Pages. Use the language nav, or fetch the same content programmatically with `shipeasy docs get --sdk <lang> <page>`.\n\n" +
    "| SDK | `--sdk` | Raw source |\n| --- | --- | --- |\n" +
    rows +
    "\n";
  writeFileSync(
    join(OUT_ROOT, "index.mdx"),
    frontmatter(
      "SDK reference",
      "Per-language feature reference for every Shipeasy SDK, generated from each repo's /docs/ standard.",
    ) + indexBody,
  );
  writeFileSync(
    join(OUT_ROOT, "meta.json"),
    JSON.stringify({ title: "Reference", pages: ["index", ...SDKS.map((s) => s.slug)] }, null, 2) +
      "\n",
  );
  // The pre-commit hook runs `prettier --write` over content/**/*.{md,mdx,json},
  // so format here too — otherwise every commit rewrites the generated files and
  // a "re-run and assert no diff" check can never pass.
  const targets = [OUT_ROOT, ...SDKS.map((s) => join(SDKS_ROOT, `${s.landing}.mdx`))];
  execFileSync("pnpm", ["exec", "prettier", "--write", "--log-level", "warn", ...targets], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });

  console.log(`\nWrote ${SDKS.length} SDK references to ${OUT_ROOT}`);
}

main();
