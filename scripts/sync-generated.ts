#!/usr/bin/env tsx
/**
 * Copy every machine-written path from `generated/` to the place the site
 * actually reads it from. Runs on `predev`, `prebuild` and `type-check`.
 *
 *   pnpm sync
 *
 * The destinations are gitignored (see generated/README.md), so this is what
 * makes a fresh clone buildable. It is a pure copy — no transformation — so
 * `verify-generated.ts` can compare bytes on either side of the edge.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { GENERATED, MIRRORS, ROOT } from "./generated-map";

let copied = 0;
const missing: string[] = [];

for (const m of MIRRORS) {
  const src = join(GENERATED, m.from);
  const dest = join(ROOT, m.to);

  if (!existsSync(src)) {
    missing.push(m.from);
    continue;
  }

  if (m.kind === "dir") {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
  copied++;
}

console.log(`sync-generated: ${copied}/${MIRRORS.length} mirrors in place`);

if (missing.length) {
  // A missing mirror is a broken build, not a warning: the page it feeds is
  // referenced from meta.json and Fumadocs fails on the dangling slug anyway —
  // better to say which generator did not run.
  console.error(
    `\nsync-generated: MISSING under generated/:\n${missing.map((p) => `  ${p}`).join("\n")}\n\n` +
      `Run \`pnpm gen\` here for the docs-owned trees, or re-run the marketplace\n` +
      `generators (\`pnpm --filter @shipeasy/cli docs\`, \`pnpm --filter @shipeasy/mcp docs\`)\n` +
      `in a shipeasy checkout — see generated/README.md.`,
  );
  process.exit(1);
}
