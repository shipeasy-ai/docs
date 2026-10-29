/**
 * Re-rank on-site search results so the page ABOUT a thing beats a page that
 * merely mentions it.
 *
 * Why this exists: the search index is one Orama collection of titles,
 * descriptions, headings and body paragraphs, all scored together as plain
 * `content` with BM25 and an OR over the query words. That ranks short chunks
 * with a rare word above the canonical page:
 *
 *   "feature flag"  -> Connectors   (its "feature request" heading stems to "feature")
 *   "kill switch"   -> Slack and SDK pages, with the Killswitches overview buried
 *   "alert rule"    -> SDK evaluation reasons
 *
 * The fix is applied after retrieval, on the grouped page results:
 *   1. pages whose TITLE says what you typed come first (whole phrase, then
 *      every word, then each word);
 *   2. then pages with a HEADING that does, and pages whose URL names it;
 *   3. generated reference pages (SDK per-language, API operations) sink unless
 *      their title matches — they carry the same words in parameter tables;
 *   4. everything else keeps the engine's order.
 *
 * Common two-word spellings of one-word product names are folded together
 * first ("kill switch" is "killswitch"), because the index only has the latter.
 */

import type { SortedResult } from "fumadocs-core/search";

/** Spellings that mean the same thing, folded to the word the docs use. */
const ALIASES: [RegExp, string][] = [
  [/\bkill[\s-]?switch(?:es)?\b/g, "killswitch"],
  [/\bfeature[\s-]?(?:flag|gate)s?\b/g, "feature flag"],
  [/\bdynamic[\s-]?(?:config|value)s?\b/g, "config"],
  [/\balert[\s-]?rules?\b/g, "alert"],
  [/\bcommand[\s-]?line\b/g, "cli"],
];

/** Words that carry no topic. */
const STOP = new Set([
  "a",
  "an",
  "the",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "how",
  "do",
  "i",
]);

/** Cheap stem: enough to make "flags"/"flag" and "mentioning"/"mention" agree. */
function stem(word: string): string {
  return word
    .replace(/(?:ing|ed)$/, "")
    .replace(/(?:es|s)$/, "")
    .replace(/e$/, "");
}

function plain(text: string): string {
  return text
    .replace(/<\/?mark>/g, "")
    .replace(/[*_`]/g, "")
    .toLowerCase();
}

export function queryTerms(query: string): string[] {
  let q = query.toLowerCase();
  for (const [re, to] of ALIASES) q = q.replace(re, to);
  return q
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0 && !STOP.has(w))
    .map(stem);
}

function stemmed(text: string): string {
  return plain(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem)
    .join(" ");
}

/** 1 for a whole word, 0.5 for a word that starts with the term, else 0. A
 *  prefix match is what lets "config" find "Configs" without also treating
 *  "configuration" as the same page. */
function wordMatch(words: string[], term: string): number {
  if (words.includes(term)) return 1;
  return words.some((w) => w.startsWith(term)) ? 0.5 : 0;
}

const GENERATED = /^\/(?:sdks\/reference|api\/operations)\//;

interface Group {
  items: SortedResult[];
  index: number;
}

function scoreGroup(g: Group, terms: string[]): number {
  if (terms.length === 0) return 0;
  const page = g.items.find((i) => i.type === "page") ?? g.items[0];
  const generated = GENERATED.test(page.url);
  const titleText = stemmed(page.content);
  const title = titleText.split(" ");
  const phrase = terms.join(" ");

  let score = 0;
  if (titleText.includes(phrase)) score += 100;
  const titleHits = terms.reduce((n, t) => n + wordMatch(title, t), 0);
  score += titleHits * 20;
  if (titleHits >= terms.length) score += 40;

  // The URL names the product ("/flags/killswitches"). Generated reference
  // pages repeat product names in their paths for every language, so only
  // authored pages get credit for it.
  if (!generated) {
    const urlWords = stemmed(page.url.split("#")[0].replace(/[/-]/g, " ")).split(" ");
    score += terms.reduce((n, t) => n + wordMatch(urlWords, t), 0) * 10;
  }

  const headingHit = g.items.some((i) => {
    if (i.type !== "heading") return false;
    const h = stemmed(i.content).split(" ");
    return terms.every((t) => wordMatch(h, t) > 0);
  });
  if (headingHit) score += 80;

  if (generated && titleHits < terms.length) score -= 50;

  // Engine order breaks ties and keeps unrelated pages where they were.
  return score - g.index * 0.5;
}

export function rankResults(query: string, results: SortedResult[]): SortedResult[] {
  const terms = queryTerms(query);
  if (terms.length === 0 || results.length === 0) return results;

  // The list arrives as consecutive runs: a page entry, then its headings and
  // paragraphs. Split on the page entries.
  const groups: Group[] = [];
  for (const item of results) {
    if (item.type === "page" || groups.length === 0) {
      groups.push({ items: [item], index: groups.length });
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }

  return groups
    .map((g) => ({ g, s: scoreGroup(g, terms) }))
    .sort((a, b) => b.s - a.s)
    .flatMap(({ g }) => g.items);
}

// ---------------------------------------------------------------------------
// Query rewriting: typos and plain-English questions
// ---------------------------------------------------------------------------
//
// The static index is exact-word BM25, so two kinds of query dead-end on
// "No results found" or return keyword scatter:
//
//   "killswtich"                              one transposed letter
//   "how do I turn off a feature in production"  no page says those words
//
// `rewriteQuery` runs BEFORE the engine, on the raw input, and returns the
// string to search for. It never changes what the reader sees in the box.

/** The words readers actually search for — product nouns and page names. A typo
 *  is corrected only toward one of these, so ordinary English is never touched. */
const VOCAB = [
  "killswitch",
  "killswitches",
  "config",
  "configs",
  "gate",
  "gates",
  "flag",
  "flags",
  "rollout",
  "rollouts",
  "targeting",
  "metric",
  "metrics",
  "alert",
  "alerts",
  "mcp",
  "cli",
  "sdk",
  "sdks",
  "webhook",
  "slack",
  "github",
  "quickstart",
  "install",
  "billing",
  "permissions",
  "attributes",
  "authenticate",
  "troubleshooting",
  "devtools",
  "bucketing",
  "assistant",
  "credits",
  "feedback",
  "errors",
  "connectors",
  "triggers",
  "modules",
  "grammar",
  "aggregations",
  "changelog",
  "environments",
  "analytics",
  "typescript",
  "python",
  "kotlin",
  "swift",
  "ruby",
];

/** Optimal-string-alignment distance: an adjacent swap ("swtich") costs 1, not 2. */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** The vocabulary word a mistyped term was most likely meant to be, if any. */
export function correctTerm(word: string): string {
  const w = word.toLowerCase();
  // Short words are too ambiguous to correct ("cl" could be anything).
  if (w.length < 5 || VOCAB.includes(w)) return word;
  const budget = w.length >= 8 ? 2 : 1;
  let best: string | null = null;
  let bestDistance = budget + 1;
  let tied = false;
  for (const candidate of VOCAB) {
    if (Math.abs(candidate.length - w.length) > budget) continue;
    const dist = editDistance(w, candidate);
    if (dist < bestDistance) {
      best = candidate;
      bestDistance = dist;
      tied = false;
    } else if (dist === bestDistance && best !== candidate) {
      tied = true;
    }
  }
  return best && !tied ? best : word;
}

/** A question that has no page of its own words, mapped to the page that answers
 *  it. First match wins, so the narrower intents come first. */
const INTENTS: [RegExp, string][] = [
  [
    /\b(?:turn|switch|shut|kill|cut)\s+(?:it\s+|them\s+|a\s+|the\s+|that\s+|this\s+)?(?:\w+\s+)?off\b|\b(?:disable|stop|pause)\b.*\b(?:feature|prod(?:uction)?|incident)\b|\bpanic\b|\bemergency\b|\bincident\b/,
    "killswitch",
  ],
  [/\b(?:release notes?|what'?s new|what changed|change ?log|new releases?)\b/, "changelog"],
  [
    /\b(?:gradually|slowly|percent(?:age)?|ramp)\b.*\b(?:release|roll|launch|ship)|\b(?:roll|release|ship|launch)\b.*\b(?:gradually|slowly|percent(?:age)?|to\s+\d+\s*%)/,
    "rollout",
  ],
  [/\b(?:notify|notified|ping|page|warn)\s+(?:me|us|the team)\b|\bget\s+alerted\b/, "alert"],
  [/\b(?:log\s?in|sign\s?in|token|api key|credentials)\b.*\b(?:cli|terminal|ci)\b/, "authenticate"],
  [/\b(?:claude|cursor|copilot|agent|ai assistant)\b.*\b(?:connect|install|plug|add)\b/, "mcp"],
];

/** What to send to the search engine for what the reader typed. */
export function rewriteQuery(raw: string): string {
  const q = raw.trim();
  if (q.length === 0) return raw;
  const lower = q.toLowerCase();
  // A question (or any multi-word phrase) with no exact-term meaning: look for intent.
  if (lower.split(/\s+/).length >= 2) {
    for (const [re, to] of INTENTS) if (re.test(lower)) return to;
  }
  return q
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : correctTerm(part)))
    .join("");
}
