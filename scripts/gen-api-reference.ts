#!/usr/bin/env tsx
/**
 * Regenerates the admin-API reference under `generated/content/api/` from the
 * OpenAPI spec.
 *
 *   pnpm gen:api
 *
 * Source of truth: `openapi.json` shipped in the published `@shipeasy/openapi`
 * package (built from RESOURCE_REGISTRY in the `shipeasy-ai/shipeasy` repo by
 * `pnpm --filter @shipeasy/openapi emit-openapi`). Bump the dependency here to
 * pick up a newer contract; there is nothing to hand-edit.
 *
 * Output is committed under `generated/`, then mirrored into `content/docs/`
 * by `scripts/sync-generated.ts`. See generated/README.md.
 */
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateFiles } from "fumadocs-openapi";
import { createOpenAPI } from "fumadocs-openapi/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Relative path string used as the document key in generated MDX. Must match
// `OPENAPI_SPEC_PATH` in `src/lib/openapi.ts` so the runtime <APIPage> resolves
// to the same registered OpenAPI server. fumadocs-openapi resolves relative
// paths from `process.cwd()`, which is the repo root both during `pnpm dev`/
// build and Cloudflare Build — so the absolute machine path must not be baked in.
const SPEC = "./node_modules/@shipeasy/openapi/openapi.json";
const OUT = join(__dirname, "../generated/content/api/operations");

// Derive a clean, plain-text meta description from the operation's OpenAPI
// `description` (which is rich MDX — bold, lists, inline code, a "**Use case:**"
// callout). We take the lead paragraph, strip markdown, collapse whitespace,
// and truncate to a search-snippet-friendly length so the value is safe to drop
// straight into YAML frontmatter and `<meta name="description">`.
function toMetaDescription(raw: string | undefined, fallback: string): string {
  if (!raw || !raw.trim()) return fallback;
  const lead = raw.split(/\n\s*\n/)[0] ?? raw;
  const plain = lead
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/\[(.+?)\]\([^)]*\)/g, "$1") // links → label
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return fallback;
  if (plain.length <= 160) return plain;
  return `${plain.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}

async function main() {
  // Wipe the previous output so removed operations don't leave orphan MDX.
  rmSync(OUT, { recursive: true, force: true });

  const openapi = createOpenAPI({ input: [SPEC] });

  await generateFiles({
    input: openapi,
    output: OUT,
    meta: true,
    // Render the OpenAPI `description` as MDX in the page body, not as a raw
    // string in YAML frontmatter. Without this, markdown (bold, lists, inline
    // code) in our resource descriptors leaks into `<DocsDescription>` and
    // shows up as literal `**bold**` / dash bullets above the operation.
    includeDescription: true,
    // Keep a short, plain-text description in the frontmatter so the page has a
    // real `<meta name="description">` and OG description for SEO (and a sidebar
    // subtitle). The full rich description still renders in the body via
    // `includeDescription`; `toMetaDescription` flattens its lead paragraph.
    frontmatter: (title, description) => ({
      title,
      description: toMetaDescription(description, title),
      full: true,
    }),
    // Two operation families are hidden from the public docs:
    //   i18n        — 2026-07 pricing restructure
    //   experiments — 2026-08 (includes universes, which only experiments use)
    // Drop their pages and their meta.json entries so a regen never resurrects
    // them. The operations stay in the OpenAPI spec, so the CLI, the MCP server
    // and every SDK admin client keep working — only the public pages go.
    beforeWrite(files) {
      const isHidden = (s: string) => /i18n|experiment|universe/i.test(s);
      for (let i = files.length - 1; i >= 0; i--) {
        const f = files[i];
        if (f.path.endsWith("meta.json")) {
          const meta = JSON.parse(f.content) as { pages?: unknown[] };
          if (Array.isArray(meta.pages)) {
            meta.pages = meta.pages.filter((p) => !isHidden(String(p)));
            f.content = JSON.stringify(meta, null, 2) + "\n";
          }
        } else if (isHidden(f.path)) {
          files.splice(i, 1);
        }
      }
    },
  });

  console.log(`generated MDX under ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
