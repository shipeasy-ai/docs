/**
 * Validation for CLI invocations cited in the docs.
 *
 * Source of truth: `src/lib/cli-commands.json`, a projection of the live
 * Commander tree emitted by `marketplace/cli/scripts/gen-cli-docs.ts` alongside
 * the CLI reference page. Regenerate both with:
 *
 *   pnpm --filter @shipeasy/cli docs
 *
 * `<Cmd>` calls `parseInvocation` at render time. Pages are statically
 * generated, so an unknown command or flag throws during `next build` — a doc
 * that cites a command the CLI doesn't ship can't be published.
 */
import manifest from "./cli-commands.json";

export interface CliCommand {
  path: string;
  aliases: string[];
  args: { name: string; required: boolean; variadic: boolean }[];
  options: string[];
}

const COMMANDS: CliCommand[] = manifest.commands;
const BY_PATH = new Map(COMMANDS.map((c) => [c.path, c]));

/**
 * Every path the tree accepts, including alias spellings — `shipeasy ks list`
 * resolves to `shipeasy release killswitch list`. Built by expanding each
 * command's aliases across its descendants' paths.
 */
const RESOLVED = new Map<string, CliCommand>(BY_PATH);
for (const c of COMMANDS) {
  for (const alias of c.aliases) {
    const aliasPrefix = `${c.path.slice(0, c.path.lastIndexOf(" "))} ${alias}`;
    for (const d of COMMANDS) {
      if (d.path === c.path || d.path.startsWith(`${c.path} `)) {
        RESOLVED.set(aliasPrefix + d.path.slice(c.path.length), d);
      }
    }
  }
}

export interface Invocation {
  /** The resolved command as written, e.g. `shipeasy ks list`. */
  readonly written: string;
  /** The canonical (de-aliased) path, e.g. `shipeasy release killswitch list`. */
  readonly command: CliCommand;
  /** Everything after the command path — args, flags, values. */
  readonly rest: string;
}

export class CliValidationError extends Error {}

/** Longest known command path that prefixes `tokens`, or null. */
function matchCommand(tokens: string[]): { command: CliCommand; used: number } | null {
  for (let n = tokens.length; n > 0; n--) {
    const hit = RESOLVED.get(tokens.slice(0, n).join(" "));
    if (hit) return { command: hit, used: n };
  }
  return null;
}

/** Did the author mean one of these? Ranked by shared leading tokens. */
function suggest(tokens: string[], limit = 3): string[] {
  const score = (p: string) => {
    const a = p.split(" ");
    let i = 0;
    while (i < a.length && i < tokens.length && a[i] === tokens[i]) i++;
    return i;
  };
  return [...BY_PATH.keys()]
    .map((p) => [p, score(p)] as const)
    .filter(([, s]) => s > 1)
    .sort((x, y) => y[1] - x[1] || x[0].length - y[0].length)
    .slice(0, limit)
    .map(([p]) => p);
}

/**
 * Parse and validate one CLI invocation. Throws `CliValidationError` when the
 * command doesn't exist or cites a flag the command doesn't declare.
 *
 * Only long flags (`--rollout-pct`) are checked — short flags are ambiguous and
 * rare in prose. A `--flag` appearing after a bare `--` separator is ignored,
 * as are flags inside a quoted value.
 */
export function parseInvocation(raw: string): Invocation {
  const text = raw.trim().replace(/\s+/g, " ");
  if (!text) throw new CliValidationError("<Cmd> was given an empty command");
  if (!text.startsWith("shipeasy ") && text !== "shipeasy") {
    throw new CliValidationError(
      `<Cmd>${raw}</Cmd> — commands must start with "shipeasy" (got "${text.split(" ")[0]}")`,
    );
  }

  const tokens = text.split(" ");
  const hit = matchCommand(tokens);
  if (!hit) {
    const hints = suggest(tokens);
    throw new CliValidationError(
      `<Cmd>${text}</Cmd> — no such CLI command.` +
        (hints.length ? ` Did you mean: ${hints.map((h) => `"${h}"`).join(", ")}?` : "") +
        ` (validated against src/lib/cli-commands.json — regenerate with \`pnpm --filter @shipeasy/cli docs\`)`,
    );
  }

  const rest = tokens.slice(hit.used);

  // Leading non-flag tokens are positional args. If the command declares fewer
  // than were written, the extra token is almost always a misspelled or
  // mis-nested subcommand (`shipeasy release ar list`, where `ar` only aliases
  // `ops alerts`) — which longest-prefix matching would otherwise swallow as an
  // argument of the parent group.
  const leading: string[] = [];
  for (const t of rest) {
    if (t.startsWith("-")) break;
    leading.push(t);
  }
  const declared = hit.command.args;
  const variadic = declared.some((a) => a.variadic);
  if (!variadic && leading.length > declared.length) {
    const extra = leading[declared.length];
    const hints = suggest([...tokens.slice(0, hit.used), extra]);
    throw new CliValidationError(
      `<Cmd>${text}</Cmd> — "${hit.command.path}" takes ${declared.length} argument(s), ` +
        `so "${extra}" isn't valid there (no such subcommand).` +
        (hints.length ? ` Did you mean: ${hints.map((h) => `"${h}"`).join(", ")}?` : ""),
    );
  }

  const cited = new Set<string>();
  for (const t of rest) {
    if (t === "--") break;
    if (!t.startsWith("--") || t === "--") continue;
    cited.add(t.split("=")[0]);
  }
  const unknown = [...cited].filter((f) => !hit.command.options.includes(f));
  if (unknown.length) {
    throw new CliValidationError(
      `<Cmd>${text}</Cmd> — "${hit.command.path}" does not accept ${unknown.join(", ")}.` +
        (hit.command.options.length
          ? ` Valid flags: ${hit.command.options.join(", ")}`
          : " It declares no flags."),
    );
  }

  return { written: text, command: hit.command, rest: rest.join(" ") };
}

/**
 * Anchor for a command on the generated reference page. `gen-cli-docs.ts` emits
 * one heading per command (`#### \`shipeasy release flags create\``); rehype
 * slugifies it by lowercasing and hyphenating, dropping the backticks.
 */
export function referenceHref(command: CliCommand): string {
  const slug = command.path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/get-started/cli-reference#${slug}`;
}

/** Every canonical command path — used by the docs' own coverage test. */
export function allCommandPaths(): string[] {
  return [...BY_PATH.keys()];
}
