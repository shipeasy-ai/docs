/**
 * Which content paths are machine-written.
 *
 * `scripts/generated-map.ts` builds its mirror table from these same lists, so
 * this file is the one place that knows. The app needs it for a smaller reason
 * than the mirror does: a generated page has no editable source here — its
 * source of truth is an OpenAPI spec or another repo entirely — so offering
 * "Edit this page" on one sends the reader to a file that either does not exist
 * in git (the destinations are gitignored) or is overwritten by the next
 * regeneration.
 *
 * Paths are relative to `content/docs/`, exactly as fumadocs reports
 * `page.path`.
 */

/** Whole trees written by a generator. */
export const GENERATED_DIRS = ["api/operations/", "sdks/reference/"] as const;

/** Individual generated pages that sit among authored ones. */
export const GENERATED_FILES = [
  "get-started/cli-reference.mdx",
  "get-started/mcp-reference.mdx",
  "get-started/llms.mdx",
] as const;

/** The per-language SDK landing pages (`/sdks/<lang>`), one file each. */
export const SDK_LANDINGS = [
  "node-typescript",
  "python",
  "go",
  "java",
  "kotlin",
  "php",
  "swift",
  "ruby",
] as const;

export function isGeneratedPage(path: string | undefined): boolean {
  if (!path) return false;
  if (GENERATED_DIRS.some((dir) => path.startsWith(dir))) return true;
  if (GENERATED_FILES.includes(path as (typeof GENERATED_FILES)[number])) return true;
  return SDK_LANDINGS.some((lang) => path === `sdks/${lang}.mdx`);
}
