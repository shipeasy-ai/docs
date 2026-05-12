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
 *   packages/openapi/openapi.json  ←  built from RESOURCE_REGISTRY by
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
const SPEC = join(__dirname, "../../../packages/openapi/openapi.json");
// Per-project output: each tag in the OpenAPI spec is currently mapped onto
// the flags-experiments product. As more tags appear (e.g. Translations,
// Feedback), split this into multiple `generateFiles` calls keyed by tag.
const OUT = join(__dirname, "../content/docs/flags-experiments/api/operations");

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
    // Keep the short, one-line `summary` as the frontmatter description so
    // sidebar cards / SEO meta stay readable. The full description is
    // rendered inside the body via `includeDescription`.
    frontmatter: (title, _description) => ({
      title,
      description: undefined,
      full: true,
    }),
  });

  console.log(`generated MDX under ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
