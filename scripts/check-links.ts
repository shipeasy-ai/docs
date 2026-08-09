#!/usr/bin/env tsx
/**
 * Fail on an internal link that doesn't resolve.
 *
 *   pnpm build && pnpm check-links
 *
 * Runs against the static export in `out/`, so it sees exactly what the Worker
 * will serve — including the generated pages, which are the ones most likely to
 * point at something that just moved.
 *
 * Anchors are checked too, against the ids the export actually emits. They used
 * to be skipped on the theory that a missing anchor is only a scroll that does
 * not happen — but that is precisely why they rot unnoticed: nothing 404s, the
 * reader lands at the top of a long page, and nobody files it. Nine were broken
 * when the check went in, four of them pointing at a heading whose em dash
 * slugifies to a double hyphen.
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

/**
 * Static assets shipped from `public/` — `llms.txt`, `agents.md` and friends.
 * These are real exported files rather than routes, so they need a file check
 * rather than a route lookup, and they are exactly the links most worth
 * verifying: they are what an agent is told to fetch.
 */
function isFile(path: string): boolean {
  const p = join(OUT, path.replace(/^\//, ""));
  return existsSync(p) && statSync(p).isFile();
}

function resolves(path: string): boolean {
  const clean = path.replace(/\/$/, "") || "/";
  if (served.has(clean) || served.has(clean + "/")) return true;
  if (isFile(path)) return true;
  if (redirects.exact.has(clean)) return true;
  return redirects.prefixes.some((p) => clean.startsWith(p));
}

/**
 * Every `id` the export emits, per route. Read lazily — most links carry no
 * fragment, and parsing 295 HTML files to answer nothing would double the
 * runtime of the common case.
 */
const idCache = new Map<string, Set<string> | null>();

function idsOf(route: string): Set<string> | null {
  if (idCache.has(route)) return idCache.get(route)!;
  const clean = route.replace(/\/$/, "");
  const file = [join(OUT, clean.slice(1), "index.html"), join(OUT, `${clean.slice(1)}.html`)].find(
    (p) => existsSync(p),
  );
  const ids = file
    ? new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
    : null;
  idCache.set(route, ids);
  return ids;
}

const bad: string[] = [];
let checked = 0;
let anchors = 0;

for (const file of walk(CONTENT, ".mdx").concat(walk(CONTENT, ".json"))) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  const lines = src.split("\n");

  lines.forEach((line, i) => {
    // Markdown links, and JSX href props — both forms appear in this content.
    const links = [
      ...[...line.matchAll(/\]\((\/[^)\s#]*)(?:#([^)\s]*))?\)/g)].map((m) => [m[1], m[2]] as const),
      ...[...line.matchAll(/href=["'](\/[^"'#]*)(?:#([^"']*))?["']/g)].map(
        (m) => [m[1], m[2]] as const,
      ),
    ];
    for (const [href, fragment] of links) {
      if (fragment && !href.startsWith("/og/")) {
        const ids = idsOf(href);
        // A route with no exported HTML is reported by the page check below;
        // do not report it twice as a missing anchor.
        if (ids) {
          anchors++;
          if (!ids.has(fragment)) bad.push(`  ${rel}:${i + 1}  ${href}#${fragment}`);
        }
      }
      // The OG endpoint is generated per page and has no file to point at.
      if (href.startsWith("/og/")) continue;
      checked++;
      if (!resolves(href)) bad.push(`  ${rel}:${i + 1}  ${href}`);
    }
  });
}

console.log(`check-links: ${checked} internal links checked, ${anchors} of them into an anchor.`);
if (bad.length) {
  console.error(`\n${bad.length} dead:\n${[...new Set(bad)].join("\n")}\n`);
  process.exit(1);
}
console.log("check-links: all resolve.");

/* ------------------------------------------------------------------ external */

/**
 * `--external` additionally HEADs every off-site link. Off by default and out
 * of the pre-push hook on purpose: it needs the network, and a third party
 * being briefly down is not a reason to block a docs commit.
 *
 * It is worth running by hand, though. Two thirds of the external links here
 * point at `shipeasy-ai.github.io` — the SDK repos' own published pages, which
 * rename when an SDK reorganises its docs and take our links with them. That
 * rot is invisible from inside this repo.
 */
if (!process.argv.includes("--external")) {
  console.log("check-links: external links not checked — pass --external to sweep them.");
  process.exit(0);
}

const external = new Map<string, string>(); // url → first place it appears
for (const file of walk(CONTENT, ".mdx")) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  let inFence = false;

  src.split("\n").forEach((line, i) => {
    // A URL inside a code fence is an example, not a link: every `curl` sample
    // here names an endpoint that answers 401 without a key, and every config
    // snippet names somebody's imaginary host. Sweeping those reported thirty
    // dead links, twenty-five of which were the docs working as intended.
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const urls = [
      ...[...line.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]),
      ...[...line.matchAll(/href=["'](https?:\/\/[^"']+)["']/g)].map((m) => m[1]),
    ];
    for (const raw of urls) {
      const url = raw.replace(/[.,;:]+$/, "");
      // Placeholders are not somewhere to send a request.
      if (/localhost|127\.0\.0\.1|example\.(com|org)|acme|\.local|[<{…]/.test(url)) continue;
      if (!external.has(url)) external.set(url, `${rel}:${i + 1}`);
    }
  });
}

/** HEAD, falling back to GET — some hosts answer 405 to a HEAD they serve. */
async function reachable(url: string): Promise<number> {
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const res = await fetch(url, { method, redirect: "follow" });
      if (res.status !== 405 || method === "GET") return res.status;
    } catch {
      return 0;
    }
  }
  return 0;
}

// `tsx` compiles this file to CJS, where top-level await is unavailable.
async function sweepExternal(): Promise<void> {
  const urls = [...external.keys()];
  const dead: string[] = [];
  const CONCURRENCY = 8;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let url = urls.shift(); url !== undefined; url = urls.shift()) {
        const status = await reachable(url);
        if (status === 0 || status >= 400) {
          dead.push(`  ${external.get(url)}  ${status || "no reply"}  ${url}`);
        }
      }
    }),
  );

  console.log(`check-links: ${external.size} external links checked.`);
  if (dead.length) {
    console.error(`\n${dead.length} dead or unreachable:\n${dead.sort().join("\n")}\n`);
    process.exit(1);
  }
  console.log("check-links: external links all resolve.");
}

void sweepExternal();
