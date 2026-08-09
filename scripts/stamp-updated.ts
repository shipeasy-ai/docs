#!/usr/bin/env tsx
/**
 * Maintains `generated/data/updated.json` — the date each page last changed.
 *
 *   tsx scripts/stamp-updated.ts content/docs/a.mdx content/docs/b.mdx
 *
 * The pre-commit hook passes the staged content files and stamps today against
 * them. That is the whole mechanism: the date is recorded by the act of
 * changing a page, so it cannot be forgotten and cannot be typed wrong.
 *
 * It replaces a hand-written `updated=` on `<DocMeta>`, which drifted the way
 * hand-written dates do — 22 pages all claimed June 19 because that is the day
 * someone did a sweep, and every page edited afterwards kept the old date. A
 * stale date is worse than none: it is a freshness claim, and readers act on it.
 *
 * Stamping at commit time rather than at build time is deliberate. The build
 * runs in Cloudflare's container, whose checkout depth is not ours to rely on;
 * the commit runs here, where the answer is simply "now". The map is committed,
 * so the build just reads it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content/docs");
const MAP = join(ROOT, "generated/data/updated.json");

/** `content/docs/flags/gates/quickstart.mdx` → `/flags/gates/quickstart`. */
function routeOf(file: string): string | null {
  const rel = relative(CONTENT, resolve(ROOT, file)).replace(/\\/g, "/");
  if (rel.startsWith("..") || !rel.endsWith(".mdx")) return null;
  const path = rel.replace(/\.mdx$/, "");
  return "/" + (path === "index" ? "" : path.replace(/\/index$/, ""));
}

const map: Record<string, string> = existsSync(MAP)
  ? (JSON.parse(readFileSync(MAP, "utf8")) as Record<string, string>)
  : {};

const today = new Date().toISOString().slice(0, 10);
let changed = 0;

for (const arg of process.argv.slice(2)) {
  const route = routeOf(arg);
  if (!route || map[route] === today) continue;
  map[route] = today;
  changed++;
}

if (changed) {
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(MAP), { recursive: true });
  writeFileSync(MAP, JSON.stringify(sorted, null, 2) + "\n");
}

console.log(`stamp-updated: ${changed} page(s) stamped ${today}`);
