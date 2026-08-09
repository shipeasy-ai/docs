/**
 * The one place that knows which paths are machine-written, and where each one
 * lands. `sync-generated.ts` copies along these edges; `verify-generated.ts`
 * checks nothing drifted; `.gitignore` / `.prettierignore` / `eslint.config.mjs`
 * list the same destinations (they can't import TypeScript).
 *
 * `from` is relative to `generated/`, `to` is relative to the repo root.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const GENERATED = join(ROOT, "generated");

export interface Mirror {
  /** path under `generated/` */
  from: string;
  /** path under the repo root */
  to: string;
  /** a directory tree, or a single file */
  kind: "dir" | "file";
  /** which repo owns the generator that writes `from` */
  owner: "docs" | "marketplace";
}

export const MIRRORS: Mirror[] = [
  { from: "content/api/operations", to: "content/docs/api/operations", kind: "dir", owner: "docs" },
  {
    from: "content/sdks/reference",
    to: "content/docs/sdks/reference",
    kind: "dir",
    owner: "docs",
  },
  {
    from: "content/get-started/cli-reference.mdx",
    to: "content/docs/get-started/cli-reference.mdx",
    kind: "file",
    owner: "marketplace",
  },
  {
    from: "content/get-started/mcp-reference.mdx",
    to: "content/docs/get-started/mcp-reference.mdx",
    kind: "file",
    owner: "marketplace",
  },
  {
    from: "data/cli-commands.json",
    to: "src/lib/cli-commands.json",
    kind: "file",
    owner: "marketplace",
  },
  // Route → the date that page last changed, stamped by the pre-commit hook.
  { from: "data/updated.json", to: "src/lib/updated.json", kind: "file", owner: "docs" },
  // The agent-facing bundles. These are stitched from content/docs itself, so
  // they are regenerated AFTER the other mirrors are in place — see the order
  // in `pnpm gen`.
  {
    from: "content/get-started/llms.mdx",
    to: "content/docs/get-started/llms.mdx",
    kind: "file",
    owner: "docs",
  },
  { from: "public/llms.txt", to: "public/llms.txt", kind: "file", owner: "docs" },
  { from: "public/llms-full.txt", to: "public/llms-full.txt", kind: "file", owner: "docs" },
  { from: "public/agents.md", to: "public/agents.md", kind: "file", owner: "docs" },
  // One markdown file per page, behind each page's "Copy Markdown" button.
  { from: "public/md", to: "public/md", kind: "dir", owner: "docs" },
];

/**
 * The SDK language landing pages (`/sdks/<lang>`) are generated too, but they
 * sit among authored SDK pages rather than in a tree of their own, so they get
 * an explicit list instead of a directory mirror. The list is shared with the
 * app (`src/lib/generated-pages.ts`), which needs the same answer to decide
 * whether a page can carry an "Edit this page" link.
 */
export { SDK_LANDINGS } from "../src/lib/generated-pages";
import { SDK_LANDINGS } from "../src/lib/generated-pages";

for (const landing of SDK_LANDINGS) {
  MIRRORS.push({
    from: `content/sdks/${landing}.mdx`,
    to: `content/docs/sdks/${landing}.mdx`,
    kind: "file",
    owner: "docs",
  });
}
