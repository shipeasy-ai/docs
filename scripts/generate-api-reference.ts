#!/usr/bin/env tsx
/**
 * Regenerates the API reference MDX pages under
 * `content/docs/api-reference/` from the admin-api OpenAPI spec.
 *
 * Run via `pnpm --filter @shipeasy/docs gen-api-reference`. The generated
 * files are checked in so the docs build doesn't depend on regeneration; CI
 * may also re-run and assert no diff to catch drift.
 *
 * Source of truth:
 *   marketplace/openapi/openapi.json  ←  built from RESOURCE_REGISTRY by
 *   `pnpm --filter @shipeasy/openapi emit-openapi`. Always re-emit before
 *   running this script when resource descriptors change.
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
// paths from `process.cwd()`, which is `apps/docs` both during `pnpm dev`/build
// and Cloudflare Build — so the absolute machine path must not be baked in.
const SPEC = "./node_modules/@shipeasy/openapi/openapi.json";
// Per-project output: each tag in the OpenAPI spec is currently mapped onto
// the flags-experiments product. As more tags appear (e.g. Translations,
// Feedback), split this into multiple `generateFiles` calls keyed by tag.
const OUT = join(__dirname, "../content/docs/flags-experiments/api/operations");

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
  });

  console.log(`generated MDX under ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
