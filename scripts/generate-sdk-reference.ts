#!/usr/bin/env tsx
/**
 * Regenerates the human-readable per-SDK reference under
 * `content/docs/sdks/reference/<lang>/` from each SDK repo's `/docs/` folder.
 *
 * Source of truth: the `/docs/` standard tree committed in each SDK submodule
 * (`packages/ts-sdk/docs`, `packages/server-sdks/sdk-<name>/docs`) — the SAME raw
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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const OUT_ROOT = join(__dirname, "../content/docs/sdks/reference");

// lang slug → { display name, path to the repo's docs/ folder, the published
// GitHub Pages base the docs op fetches from }
const SDKS: { slug: string; name: string; docs: string; pages: string }[] = [
  {
    slug: "typescript",
    name: "TypeScript / JavaScript",
    docs: "packages/ts-sdk/docs",
    pages: "https://shipeasy-ai.github.io/sdk",
  },
  {
    slug: "python",
    name: "Python",
    docs: "packages/server-sdks/sdk-python/docs",
    pages: "https://shipeasy-ai.github.io/sdk-python",
  },
  {
    slug: "go",
    name: "Go",
    docs: "packages/server-sdks/sdk-go/docs",
    pages: "https://shipeasy-ai.github.io/sdk-go",
  },
  {
    slug: "java",
    name: "Java",
    docs: "packages/server-sdks/sdk-java/docs",
    pages: "https://shipeasy-ai.github.io/sdk-java",
  },
  {
    slug: "kotlin",
    name: "Kotlin",
    docs: "packages/server-sdks/sdk-kotlin/docs",
    pages: "https://shipeasy-ai.github.io/sdk-kotlin",
  },
  {
    slug: "php",
    name: "PHP",
    docs: "packages/server-sdks/sdk-php/docs",
    pages: "https://shipeasy-ai.github.io/sdk-php",
  },
  {
    slug: "swift",
    name: "Swift",
    docs: "packages/server-sdks/sdk-swift/docs",
    pages: "https://shipeasy-ai.github.io/sdk-swift",
  },
  {
    slug: "ruby",
    name: "Ruby",
    docs: "packages/server-sdks/sdk-ruby/docs",
    pages: "https://shipeasy-ai.github.io/sdk-ruby",
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

function emitPage(
  outDir: string,
  fileBase: string,
  navTitle: string,
  raw: string,
  sourceUrl: string,
) {
  const { title, body, description } = splitHeading(raw);
  const fm = frontmatter(title ?? navTitle, description);
  const banner = `<Callout type="info">Generated from the SDK's own \`/docs/\` — also served raw at [\`${sourceUrl}\`](${sourceUrl}).</Callout>\n\n`;
  writeFileSync(join(outDir, `${fileBase}.mdx`), fm + banner + mdxEscape(body) + "\n");
}

function emitSnippets(outDir: string, m: Manifest, docsDir: string, base: string) {
  let body =
    "Minimal copy-paste blocks, grouped by the registry taxonomy. These are the same leaves the `docs get` op returns.\n\n";
  for (const [group, leaves] of Object.entries(m.snippets ?? {})) {
    body += `## ${group}\n\n`;
    for (const [leaf, rel] of Object.entries(leaves)) {
      const raw = read(docsDir, rel);
      const { body: sb } = splitHeading(raw);
      body += `### ${group} / ${leaf}\n\n${mdxEscape(sb.trim())}\n\n`;
      void base;
    }
  }
  writeFileSync(
    join(outDir, "snippets.mdx"),
    frontmatter(
      "Snippets",
      "Minimal copy-paste blocks for flags, configs, kill switches, experiments and i18n.",
    ) + body,
  );
}

function emitSkill(outDir: string, m: Manifest, docsDir: string, name: string) {
  if (!m.skill) return;
  const raw = read(docsDir, m.skill);
  // Render the skill verbatim inside a fenced block so its YAML frontmatter is
  // visible and copy-pasteable (it installs frontmatter-included).
  const fenced = "```markdown\n" + raw.replace(/\n$/, "") + "\n```\n";
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
      const rel = m.pages[key];
      if (!rel) continue;
      const fileBase = key === "overview" ? "index" : key;
      emitPage(outDir, fileBase, PAGE_TITLES[key], read(docsDir, rel), `${sdk.pages}/${rel}`);
      if (key !== "overview") navPages.push(fileBase);
    }
    emitSnippets(outDir, m, docsDir, sdk.pages);
    emitSkill(outDir, m, docsDir, sdk.name);

    const langMeta = {
      title: sdk.name,
      pages: ["index", ...navPages, "---More---", "snippets", ...(m.skill ? ["skill"] : [])],
    };
    writeFileSync(join(outDir, "meta.json"), JSON.stringify(langMeta, null, 2) + "\n");
    console.log(
      `✓ ${sdk.slug}: ${navPages.length + 1} pages + snippets${m.skill ? " + skill" : ""}`,
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
  console.log(`\nWrote ${SDKS.length} SDK references to ${OUT_ROOT}`);
}

main();
