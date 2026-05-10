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
 *   packages/admin-api/openapi.json  ←  built from RESOURCE_REGISTRY by
 *   `pnpm --filter @shipeasy/admin-api emit-openapi`. Always re-emit before
 *   running this script when resource descriptors change.
 */
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateFiles } from "fumadocs-openapi";
import { createOpenAPI } from "fumadocs-openapi/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SPEC = join(__dirname, "../../../packages/admin-api/openapi.json");
const OUT = join(__dirname, "../content/docs/api-reference");

async function main() {
  // Wipe the previous output so removed operations don't leave orphan MDX.
  rmSync(OUT, { recursive: true, force: true });

  const openapi = createOpenAPI({ input: [SPEC] });

  await generateFiles({
    input: openapi,
    output: OUT,
    meta: true,
  });

  console.log(`generated MDX under ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
