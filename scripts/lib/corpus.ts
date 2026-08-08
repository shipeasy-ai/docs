/**
 * The docs tree, in the order the site's own navigation puts it.
 *
 * The stitched bundles must read like the site reads — a model handed the
 * corpus in `readdir` order gets `assistant/` before `get-started/`, which is
 * exactly backwards for someone trying to install the thing. Fumadocs derives
 * that order from the `meta.json` files, so this reads the same files.
 *
 * Anything on disk but missing from a `meta.json` is appended rather than
 * dropped: a page that fell out of the nav is a nav bug, not a reason to hide
 * it from agents.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { splitFrontmatter } from "./mdx-text";

export interface Page {
  /** absolute path to the .mdx */
  file: string;
  /** site route, e.g. `/get-started/quickstart` */
  route: string;
  title: string;
  description: string;
  /** top-level tab this page belongs to, e.g. `get-started` */
  tab: string;
  /** human label for the tab */
  tabTitle: string;
  /** the `---Label---` group it sits under, if any */
  group?: string;
  /** raw MDX below the frontmatter */
  body: string;
}

interface Meta {
  title?: string;
  pages?: string[];
}

function readMeta(dir: string): Meta | null {
  const f = join(dir, "meta.json");
  if (!existsSync(f)) return null;
  return JSON.parse(readFileSync(f, "utf8")) as Meta;
}

function routeOf(root: string, file: string): string {
  const rel = relative(root, file)
    .replace(/\\/g, "/")
    .replace(/\.mdx$/, "");
  const path = rel === "index" ? "" : rel.replace(/\/index$/, "");
  return "/" + path;
}

function loadPage(root: string, file: string, tab: string, tabTitle: string, group?: string): Page {
  const { fm, body } = splitFrontmatter(readFileSync(file, "utf8"));
  return {
    file,
    route: routeOf(root, file),
    title: fm.title ?? basename(file, ".mdx"),
    description: fm.description ?? "",
    tab,
    tabTitle,
    group,
    body,
  };
}

function mdxIn(dir: string): string[] {
  return readdirSync(dir)
    .filter((e) => e.endsWith(".mdx"))
    .map((e) => join(dir, e))
    .sort();
}

function subdirsIn(dir: string): string[] {
  return readdirSync(dir)
    .map((e) => join(dir, e))
    .filter((p) => statSync(p).isDirectory())
    .sort();
}

/**
 * Walk one directory in meta order, then sweep whatever the meta missed.
 * `exclude` holds directory names whose pages are enumerated elsewhere (the
 * generated reference trees, which are far too large to inline).
 */
function collect(
  root: string,
  dir: string,
  tab: string,
  tabTitle: string,
  exclude: Set<string>,
  acc: Page[],
): void {
  const meta = readMeta(dir);
  const taken = new Set<string>();
  let group: string | undefined;

  for (const entry of meta?.pages ?? []) {
    const sep = /^---(.*)---$/.exec(entry);
    if (sep) {
      group = sep[1].trim();
      continue;
    }
    if (entry === "..." || entry.startsWith("!")) continue;

    const asFile = join(dir, `${entry}.mdx`);
    const asDir = join(dir, entry);
    if (existsSync(asFile)) {
      taken.add(asFile);
      acc.push(loadPage(root, asFile, tab, tabTitle, group));
    } else if (existsSync(asDir) && statSync(asDir).isDirectory()) {
      taken.add(asDir);
      if (exclude.has(relative(root, asDir).replace(/\\/g, "/"))) continue;
      collect(root, asDir, tab, tabTitle, exclude, acc);
    }
  }

  // index.mdx is a folder's landing page and is rarely listed in its own meta.
  const index = join(dir, "index.mdx");
  if (existsSync(index) && !taken.has(index)) {
    taken.add(index);
    acc.push(loadPage(root, index, tab, tabTitle, group));
  }
  for (const f of mdxIn(dir)) {
    if (taken.has(f)) continue;
    acc.push(loadPage(root, f, tab, tabTitle, group));
  }
  for (const d of subdirsIn(dir)) {
    if (taken.has(d)) continue;
    if (exclude.has(relative(root, d).replace(/\\/g, "/"))) continue;
    collect(root, d, tab, tabTitle, exclude, acc);
  }
}

/** Every authored page, nav-ordered. `exclude` is root-relative directories. */
export function loadCorpus(root: string, exclude: string[] = []): Page[] {
  const skip = new Set(exclude);
  const rootMeta = readMeta(root);
  const acc: Page[] = [];

  const home = join(root, "index.mdx");
  if (existsSync(home)) acc.push(loadPage(root, home, "", "Home"));

  const taken = new Set<string>([home]);
  for (const entry of rootMeta?.pages ?? []) {
    if (/^---.*---$/.test(entry) || entry === "...") continue;
    const asFile = join(root, `${entry}.mdx`);
    const asDir = join(root, entry);
    if (existsSync(asFile)) {
      taken.add(asFile);
      acc.push(loadPage(root, asFile, entry, entry));
    } else if (existsSync(asDir)) {
      taken.add(asDir);
      if (skip.has(entry)) continue;
      collect(root, asDir, entry, readMeta(asDir)?.title ?? entry, skip, acc);
    }
  }

  // A tab missing from the root meta would otherwise vanish silently.
  for (const d of subdirsIn(root)) {
    if (taken.has(d) || skip.has(relative(root, d))) continue;
    collect(root, d, basename(d), readMeta(d)?.title ?? basename(d), skip, acc);
  }

  // Dedupe, first occurrence wins — the nav order is the one we want.
  const seen = new Set<string>();
  return acc.filter((p) => (seen.has(p.route) ? false : (seen.add(p.route), true)));
}

/** Routes under an excluded tree, for the index that still has to list them. */
export function listRoutes(root: string, dir: string): { route: string; title: string }[] {
  const out: { route: string; title: string }[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d).sort()) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".mdx")) {
        const { fm } = splitFrontmatter(readFileSync(p, "utf8"));
        out.push({ route: routeOf(root, p), title: fm.title ?? basename(p, ".mdx") });
      }
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}
