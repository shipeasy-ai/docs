#!/usr/bin/env tsx
/**
 * Validate every `shipeasy …` invocation written anywhere in the docs against
 * the real CLI command tree (`src/lib/cli-commands.json`).
 *
 * `<Cmd>` already fails the build for commands cited through the component, but
 * most invocations live in fenced shell blocks and JSX `cmd=` props, which the
 * component never sees. This script covers those:
 *
 *   pnpm --filter @shipeasy/docs check-cli
 *
 * Exits non-zero listing every unknown command or flag, with file:line.
 *
 * Only *invocations* are checked — text inside a shell fence, an inline code
 * span, or a `cmd=`/`run:` prop. Prose that merely says "shipeasy" is ignored,
 * so the report stays trustworthy enough to gate on.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseInvocation } from "../src/lib/cli-commands";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dirname, "../content/docs");

// The generated reference documents the tree itself; its usage lines carry
// Commander placeholders (`[options]`, `[command]`) that aren't real args.
const SKIP_FILES = new Set(["get-started/cli-reference.mdx"]);
// Generated from the OpenAPI spec in the marketplace submodule — fix upstream,
// not here. Reported separately so they're visible but don't gate the build.
const UPSTREAM_PREFIX = "flags-experiments/api/";

const SHELL_LANGS = /^(bash|sh|shell|zsh|console|terminal)\b/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".mdx")) out.push(p);
  }
  return out;
}

/** Strip shell noise so what remains is one invocation, or null. */
function normalise(raw: string): string | null {
  // Leading prompt, then any `VAR=value` env assignments, then the binary.
  let s = raw.trim().replace(/^[$>]\s+/, "");
  while (/^[A-Z_][A-Z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s+/.test(s)) {
    s = s.replace(/^[A-Z_][A-Z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s+/, "");
  }
  // `shipeasy` must be the command being run, not an argument to something else
  // (`gemini mcp add shipeasy npx …`) and not part of a package name
  // (`npx @shipeasy/cli`). Anything else on the line first means it isn't ours.
  if (!s.startsWith("shipeasy ")) return null;
  s = s
    .replace(/\s*#.*$/, "") // trailing comment
    .replace(/\s*[|>].*$/, "") // pipe / redirect
    .replace(/\s*&&.*$/, "")
    .replace(/\\\s*$/, "")
    // Values are free-form and may contain spaces; drop from the first quote,
    // JSON literal or `<placeholder>` onward. Flags before it still get checked.
    .replace(/\s+['"{[<].*$/, "")
    .trim();
  // A lone `shipeasy`, or an ellipsis/placeholder continuation, isn't checkable.
  if (!/^shipeasy [a-z][a-z0-9-]*/.test(s)) return null;
  if (/[……]/.test(s)) return null;
  return s;
}

interface Finding {
  file: string;
  line: number;
  invocation: string;
  message: string;
}
const failures: Finding[] = [];
const upstream: Finding[] = [];
let checked = 0;

for (const file of walk(CONTENT)) {
  const rel = relative(CONTENT, file);
  if (SKIP_FILES.has(rel)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  let inShellFence = false;
  let inOtherFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*```+\s*(\S*)/);
    if (fence) {
      if (inShellFence || inOtherFence) {
        inShellFence = inOtherFence = false;
      } else if (SHELL_LANGS.test(fence[1])) {
        inShellFence = true;
      } else {
        inOtherFence = true;
      }
      continue;
    }
    if (inOtherFence) continue;

    const candidates: string[] = [];
    if (inShellFence) {
      // Stitch `\` continuations so multi-line invocations validate as one.
      let logical = line;
      let j = i;
      while (/\\\s*$/.test(logical) && j + 1 < lines.length) {
        logical = `${logical.replace(/\\\s*$/, "")} ${lines[++j].trim()}`;
      }
      candidates.push(logical);
    } else {
      // Prose line: only inline code spans and quoted JSX props count.
      for (const m of line.matchAll(/`([^`]*\bshipeasy\b[^`]*)`/g)) candidates.push(m[1]);
      for (const m of line.matchAll(/(?:cmd|run)[:=]\s*["']([^"']*\bshipeasy\b[^"']*)["']/g)) {
        candidates.push(m[1]);
      }
    }

    for (const cand of candidates) {
      const inv = normalise(cand);
      if (!inv) continue;
      checked++;
      try {
        parseInvocation(inv);
      } catch (e) {
        const f = { file: rel, line: i + 1, invocation: inv, message: (e as Error).message };
        (rel.startsWith(UPSTREAM_PREFIX) ? upstream : failures).push(f);
      }
    }
  }
}

const show = (f: Finding) => `  ${f.file}:${f.line}\n    ${f.invocation}\n    ${f.message}\n`;

console.log(`Checked ${checked} CLI invocations across the docs.`);
if (upstream.length) {
  console.log(
    `\n${upstream.length} in generated OpenAPI pages (fix in the marketplace spec, not here):\n`,
  );
  for (const f of upstream) console.log(show(f));
}
if (failures.length) {
  console.error(`\n${failures.length} invalid:\n`);
  for (const f of failures) console.error(show(f));
  process.exit(1);
}
console.log("All authored invocations valid.");
