/**
 * MDX -> plain text, for the machine-readable bundles (`llms-full.txt`,
 * `agents.md`).
 *
 * These pages are not Markdown — they are MDX carrying ~50 bespoke React
 * components, some of which hold real content in props rather than children
 * (`<SeeAlso links={[…]} />`, `<TypeTable type={{…}} />`, `<InstallTabs npm=… />`).
 * Stripping every tag would silently drop that; leaving the tags in would feed a
 * model JSX it has to reverse-engineer. So each component that carries meaning
 * gets an explicit rendering, and the unknown remainder degrades to "keep the
 * children, drop the tag".
 *
 * The one hard rule: **fenced code blocks come out byte-identical**. An agent
 * copying a snippet out of `llms-full.txt` must get exactly what the page shows.
 */

export interface Frontmatter {
  title?: string;
  description?: string;
}

// The closing fence is deliberately allowed a DIFFERENT indent from the
// opening one: MDX authors indent a fence to match its surrounding JSX but
// routinely let the closing ticks drift back to column 0. Requiring a match
// made the regex run on to the *next* fence and swallow the JSX between them,
// which then came out verbatim in the bundle.
const FENCE = /^([ \t]*)(```+|~~~+)[^\n]*\n[\s\S]*?^[ \t]*\2[ \t]*$/gm;

/** Components whose children are decorative wrappers — drop the tag, keep the inside. */
const UNWRAP = new Set([
  "TileGrid",
  "CardGrid",
  "Steps",
  "Quickstart",
  "Tabs",
  "Accordions",
  "Terminal",
  "ToolTable",
  "Out",
  "Files",
  "Folder",
]);

/** Components that are pure chrome — drop the element and everything in it. */
const DROP = new Set([
  "DocMeta",
  "Mermaid",
  "ConvertCTA",
  "DocFeedback",
  "ApiList",
  "APIPage",
  "DecisionPicker",
  "DevtoolsHero",
  "AlertChartLive",
  "SceneFrame",
  "Prompt",
  "Pill",
  "ProductSwitcher",
  "Logo",
]);

/**
 * Props worth keeping when a component is otherwise unrenderable — the scene
 * components in the Slack and assistant pages hold their whole example in
 * `prompt` / `reply`, and dropping them loses the only copy of that dialogue.
 */
const PROSE_PROPS = ["prompt", "reply", "body", "subtitle", "caption", "note", "goal", "desc"];

/** Read the frontmatter block and return it alongside the body below it. */
export function splitFrontmatter(src: string): { fm: Frontmatter; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) return { fm: {}, body: src };
  const fm: Frontmatter = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(title|description):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1] as keyof Frontmatter] = stripQuotes(kv[2].trim());
  }
  return { fm, body: src.slice(m[0].length) };
}

function stripQuotes(s: string): string {
  return s.replace(/^["'](.*)["']$/s, "$1");
}

/**
 * Walk forward from `<` to the `>` that closes the tag, ignoring anything
 * inside a JSX expression or a string. A naive `/<[^>]*>/` breaks on the very
 * first `meta={<span>…</span>}` prop, which most `<Tile>`s have.
 */
function readTag(src: string, start: number): { end: number; selfClosing: boolean } | null {
  let depth = 0;
  let quote: string | null = null;
  for (let i = start + 1; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    // Quotes only delimit strings at attribute level. Inside a JSX expression
    // the same characters are ordinary prose — an apostrophe in a
    // `description: (<>you don't…</>)` opened a string that never closed, and
    // the whole element leaked into the output verbatim.
    if (depth === 0 && (c === '"' || c === "'" || c === "`")) {
      quote = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return { end: i + 1, selfClosing: src[i - 1] === "/" };
  }
  return null;
}

/** Skip to just past the `</Name>` that matches an already-consumed `<Name>`. */
function skipToClose(src: string, name: string, from: number): number {
  const open = new RegExp(`<${name}[\\s>/]`, "g");
  const close = new RegExp(`</${name}\\s*>`, "g");
  let depth = 1;
  let i = from;
  while (depth > 0) {
    close.lastIndex = i;
    const c = close.exec(src);
    if (!c) return src.length;
    open.lastIndex = i;
    let o = open.exec(src);
    while (o && o.index < c.index) {
      depth++;
      open.lastIndex = o.index + 1;
      o = open.exec(src);
    }
    depth--;
    i = c.index + c[0].length;
  }
  return i;
}

/**
 * `title="x"`, `title='x'` or `title={"x"}` out of a raw opening tag. The two
 * quote styles are matched separately, not as one `["']` class — otherwise
 * `title='Vite says "process is not defined"'` truncates at the inner quote.
 */
function prop(tag: string, name: string): string | null {
  const m =
    new RegExp(`\\b${name}="([^"]*)"`).exec(tag) ??
    new RegExp(`\\b${name}='([^']*)'`).exec(tag) ??
    new RegExp(`\\b${name}=\\{"([^"]*)"\\}`).exec(tag) ??
    new RegExp(`\\b${name}=\\{'([^']*)'\\}`).exec(tag) ??
    new RegExp(`\\b${name}=\\{\`([^\`]*)\`\\}`).exec(tag);
  return m ? m[1] : null;
}

/** Balanced `{ … }` starting at the `{` that follows `prop=`. */
function propExpr(tag: string, name: string): string | null {
  const at = tag.search(new RegExp(`\\b${name}=\\{`));
  if (at < 0) return null;
  const start = tag.indexOf("{", at);
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < tag.length; i++) {
    const c = tag[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (depth <= 1 && (c === '"' || c === "'" || c === "`")) quote = c;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return tag.slice(start + 1, i);
  }
  return null;
}

/** Split a `[…]` or `{…}` literal on the commas that sit at its own depth. */
function splitTop(src: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let last = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (depth === 0 && (c === '"' || c === "'" || c === "`")) quote = c;
    else if ("{[(<".includes(c)) depth++;
    else if ("}])>".includes(c)) depth--;
    else if (c === "," && depth === 0) {
      out.push(src.slice(last, i));
      last = i + 1;
    }
  }
  out.push(src.slice(last));
  return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * Flatten a JSX fragment used as a description into one line of prose. The
 * source shapes vary a lot — a bare string, a `(<>…</>)` fragment, two string
 * literals concatenated across a line break — so this strips wrappers rather
 * than trying to parse them.
 */
function flatten(src: string): string {
  return src
    .replace(/<code>([\s\S]*?)<\/code>/g, "`$1`")
    .replace(/<\/?>/g, "")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/["'`]\s*\+\s*["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[({[\s]+/, "")
    .replace(/[\s,)}\]]+$/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

/** A prop that may be a plain string or a JSX expression, as plain text. */
function propText(tag: string, name: string): string | null {
  const plain = prop(tag, name);
  if (plain) return plain;
  const expr = propExpr(tag, name);
  const flat = expr ? flatten(expr) : "";
  return flat || null;
}

/** `links={[{ href, title, note }]}` -> a markdown list. */
function renderLinkList(expr: string | null, heading: string): string {
  if (!expr) return "";
  const items = splitTop(expr.replace(/^\s*\[|\]\s*$/g, ""));
  const lines: string[] = [];
  for (const item of items) {
    const href = prop(item, "href") ?? /href:\s*["']([^"']+)["']/.exec(item)?.[1];
    const title = /title:\s*["']([^"']+)["']/.exec(item)?.[1] ?? href;
    if (!href) continue;
    const note = /note:\s*(["'][^"']*["']|<>[\s\S]*?<\/>)/.exec(item)?.[1];
    lines.push(`- [${title}](${href})${note ? ` — ${flatten(note)}` : ""}`);
  }
  return lines.length ? `\n**${heading}**\n\n${lines.join("\n")}\n` : "";
}

/** `type={{ Key: { type, description } }}` -> a markdown list. */
function renderTypeTable(tag: string): string {
  const expr = propExpr(tag, "type");
  if (!expr) return "";
  const body = expr.replace(/^\s*\{|\}\s*$/g, "");
  const lines: string[] = [];
  for (const entry of splitTop(body)) {
    const key = /^\s*(?:["']([^"']+)["']|([A-Za-z0-9_$]+))\s*:/.exec(entry);
    if (!key) continue;
    const name = key[1] ?? key[2];
    const type = /\btype:\s*["']([^"']*)["']/.exec(entry)?.[1];
    const descAt = entry.search(/\bdescription:/);
    const desc = descAt < 0 ? "" : flatten(entry.slice(entry.indexOf(":", descAt) + 1));
    lines.push(`- \`${name}\`${type ? ` (${type})` : ""}${desc ? ` — ${desc}` : ""}`);
  }
  return lines.length ? `\n${lines.join("\n")}\n` : "";
}

/** Whatever a component holds in PROSE_PROPS, one line each. */
function renderProseProps(tag: string): string {
  const out = PROSE_PROPS.map((p) => prop(tag, p))
    .filter((v): v is string => Boolean(v && v.length > 2))
    .map((v) => `> ${v}`);
  return out.length ? `\n${out.join("\n")}\n` : "";
}

/**
 * Render one opening tag. Returns the replacement text, and whether the
 * element's children should be skipped wholesale.
 */
function renderOpen(name: string, tag: string, selfClosing: boolean): [string, boolean] {
  if (DROP.has(name)) return ["", !selfClosing];
  if (UNWRAP.has(name)) return ["", false];

  switch (name) {
    case "Hero": {
      const sub = prop(tag, "subtitle");
      return [sub ? `\n${sub}\n` : "", !selfClosing];
    }
    case "Callout": {
      const title = propText(tag, "title");
      return [title ? `\n> **${title}**\n` : "\n> **Note**\n", false];
    }
    case "Step":
    case "QuickstartStep":
    case "Accordion": {
      const title = propText(tag, "title");
      // The quickstart carries each step's command in a `cmd` prop rather than
      // in a fence, so dropping props here would lose the actual instruction.
      const cmd = prop(tag, "cmd");
      const head = title ? `\n**${title}**\n` : "";
      return [cmd ? `${head}\n\`\`\`bash\n${cmd}\n\`\`\`\n` : head, false];
    }
    case "Tab": {
      const v = prop(tag, "value") ?? prop(tag, "title");
      return [v ? `\n**${v}**\n` : "", false];
    }
    case "Tile":
    case "Card": {
      const title = propText(tag, "title") ?? prop(tag, "name");
      const href = prop(tag, "href");
      const head = href ? `[${title ?? href}](${href})` : (title ?? "");
      return [head ? `\n- **${head}** — ` : "\n- ", false];
    }
    case "ToolRow": {
      const n = prop(tag, "name");
      const d = prop(tag, "desc");
      return [`\n- \`${n}\`${d ? ` — ${d}` : ""} `, false];
    }
    case "Cmd": {
      const cmd = prop(tag, "cmd");
      return [cmd ? `\`${cmd}\`` : "`", false];
    }
    case "InstallTabs": {
      // One canonical line is enough; the others are the same command with a
      // different package manager in front of it.
      const cmd = prop(tag, "npm") ?? prop(tag, "pnpm");
      return [cmd ? `\n\`\`\`bash\n${cmd}\n\`\`\`\n` : "", !selfClosing];
    }
    case "SeeAlso":
      return [renderLinkList(propExpr(tag, "links"), "Related"), !selfClosing];
    case "JourneyPath": {
      const title = propText(tag, "title");
      const steps = renderLinkList(propExpr(tag, "steps"), title ?? "Journey");
      return [steps, !selfClosing];
    }
    case "TypeTable":
      return [renderTypeTable(tag), !selfClosing];
    default:
      // Unknown component: keep any prose it carries in props, keep children.
      return [renderProseProps(tag), false];
  }
}

function renderClose(name: string): string {
  if (name === "Cmd") return "`";
  if (name === "Tile" || name === "Card" || name === "ToolRow") return "\n";
  if (name === "Callout" || name === "Step" || name === "QuickstartStep") return "\n";
  return "";
}

const ENTITIES: Record<string, string> = {
  "&rarr;": "→",
  "&larr;": "←",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&quot;": '"',
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&times;": "×",
  "&amp;": "&",
};

/**
 * JSX children arrive indented by however deep their component nested. Four
 * spaces of that is an indented code block in Markdown, so a `<Step>`'s prose
 * would read as a snippet. Dedent each blank-line-separated block by its own
 * common indent — code fences are placeholders at this point and were already
 * dedented as units, so nothing that matters to a reader moves.
 */
function dedentBlocks(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim());
      if (!lines.length) return block;
      const pad = Math.min(...lines.map((l) => /^[ \t]*/.exec(l)![0].length));
      if (!pad) return block;
      return block
        .split("\n")
        .map((l) => l.slice(pad))
        .join("\n");
    })
    .join("\n\n");
}

/**
 * A `<Tile>`/`<Card>` opens a list item and its children land on the following
 * lines; leaving them broken turns one bullet into a bullet plus an orphan
 * paragraph. Pull the continuation back onto the bullet.
 */
function joinListItems(text: string): string {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const prev = out[out.length - 1];
    const continues =
      prev !== undefined &&
      /^- /.test(prev) &&
      line.trim() &&
      !/^[-*#>|]/.test(line.trim()) &&
      !line.includes("\u0000FENCE");
    if (continues) out[out.length - 1] = `${prev.replace(/\s+$/, "")} ${line.trim()}`;
    else out.push(line);
  }
  return out.join("\n");
}

/** Convert one MDX body to plain text. Code fences survive untouched. */
export function mdxToText(body: string): string {
  // 1. Park the code fences so nothing below can touch their contents. JSX
  //    children are indented in the source, and a fence inherits that indent —
  //    which reads as a code block nested inside a code block. Dedent the block
  //    as a unit so indentation *inside* the snippet survives exactly.
  const fences: string[] = [];
  let src = body.replace(FENCE, (block: string, indent: string) => {
    const flat = indent
      ? block
          .split("\n")
          .map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l.trimStart()))
          .join("\n")
      : block;
    return `\u0000FENCE${fences.push(flat) - 1}\u0000`;
  });

  // 2. import/export lines are build plumbing, never content.
  src = src.replace(/^\s*(import|export)\s+[^\n]*\n/gm, "");

  // 3. Walk the JSX.
  let out = "";
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt < 0) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, lt);

    const closing = /^<\/([A-Z][A-Za-z0-9]*)\s*>/.exec(src.slice(lt));
    if (closing) {
      out += renderClose(closing[1]);
      i = lt + closing[0].length;
      continue;
    }

    const opening = /^<([A-Z][A-Za-z0-9]*)[\s/>]/.exec(src.slice(lt));
    if (!opening) {
      out += "<";
      i = lt + 1;
      continue;
    }

    const tag = readTag(src, lt);
    if (!tag) {
      out += "<";
      i = lt + 1;
      continue;
    }

    const name = opening[1];
    const [text, dropChildren] = renderOpen(name, src.slice(lt, tag.end), tag.selfClosing);
    out += text;
    i = tag.selfClosing || !dropChildren ? tag.end : skipToClose(src, name, tag.end);
  }

  // 4. Leftover MDX expressions and HTML entities.
  out = out
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\{["'`]([^"'`]*)["'`]\}/g, "$1")
    .replace(/&[a-z]+;/g, (e) => ENTITIES[e] ?? e)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");

  // 5. Undo the source's JSX indentation and re-join the split bullets.
  out = joinListItems(dedentBlocks(out));

  // 6. Put the code back.
  return out.replace(/\u0000FENCE(\d+)\u0000/g, (_, n: string) => fences[Number(n)]).trim();
}
