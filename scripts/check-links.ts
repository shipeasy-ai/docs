#!/usr/bin/env tsx
/**
 * Fail on an internal link that doesn't resolve.
 *
 *   pnpm build && pnpm check-links
 *
 * Runs against the static export in `out/`, so it sees exactly what the Worker
 * will serve — including the generated pages, which are the ones most likely to
 * point at something that just moved. Anchors (`#…`) are not checked; a missing
 * page is a 404, a missing anchor is a scroll that doesn't happen.
 *
 * `public/_redirects` counts as a destination: a link to a page we deliberately
 * moved is fine as long as a rule catches it.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content/docs");
const OUT = join(ROOT, "out");

if (!existsSync(OUT)) {
  console.error("check-links: no out/ — run `pnpm build` first.");
  process.exit(1);
}

function walk(dir: string, ext: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, ext, acc);
    else if (p.endsWith(ext)) acc.push(p);
  }
  return acc;
}

/** Every path the export actually serves, normalised to a leading-slash route. */
const served = new Set<string>(["/"]);
for (const f of walk(OUT, ".html")) {
  const rel = relative(OUT, f).replace(/\\/g, "/");
  served.add("/" + rel.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, ""));
}

/** Redirect sources, as literal paths plus splat prefixes. */
const redirects: { exact: Set<string>; prefixes: string[] } = { exact: new Set(), prefixes: [] };
for (const line of readFileSync(join(ROOT, "public/_redirects"), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const from = trimmed.split(/\s+/)[0];
  if (from.endsWith("/*")) redirects.prefixes.push(from.slice(0, -2));
  else redirects.exact.add(from.replace(/\/$/, "") || "/");
}

function resolves(path: string): boolean {
  const clean = path.replace(/\/$/, "") || "/";
  if (served.has(clean) || served.has(clean + "/")) return true;
  if (redirects.exact.has(clean)) return true;
  return redirects.prefixes.some((p) => clean.startsWith(p));
}

const bad: string[] = [];
let checked = 0;

for (const file of walk(CONTENT, ".mdx").concat(walk(CONTENT, ".json"))) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  const lines = src.split("\n");

  lines.forEach((line, i) => {
    // Markdown links, and JSX href props — both forms appear in this content.
    const hrefs = [
      ...[...line.matchAll(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g)].map((m) => m[1]),
      ...[...line.matchAll(/href=["'](\/[^"'#]*)(#[^"']*)?["']/g)].map((m) => m[1]),
    ];
    for (const href of hrefs) {
      // Not site routes: the OG image endpoint and static assets.
      if (href.startsWith("/og/") || /\.(png|svg|jpg|json|txt|xml)$/.test(href)) continue;
      checked++;
      if (!resolves(href)) bad.push(`  ${rel}:${i + 1}  ${href}`);
    }
  });
}

console.log(`check-links: ${checked} internal links checked.`);
if (bad.length) {
  console.error(`\n${bad.length} dead:\n${[...new Set(bad)].join("\n")}\n`);
  process.exit(1);
}
console.log("check-links: all resolve.");
