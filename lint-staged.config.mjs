// lint-staged config (consumed by the native pre-commit hook in .githooks).
//
// `generated/` and the mirrored copies under content/docs are deliberately
// absent: prettier rewrites upstream Markdown emphasis (`api_key` becomes
// `api*key`), which corrupts SDK-repo prose and makes `pnpm verify:generated`
// report drift on every run. They're listed in .prettierignore too.
//
// The heavier gates (a real build, then the dead-link sweep) run on pre-push —
// they need `out/`, which costs ~40s to produce, and that is too much to pay on
// every commit.
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["prettier --write", "eslint --fix --no-warn-ignored --quiet"],
  "*.{json,md,mdx,yaml,yml,css}": ["prettier --write"],

  // Content changed → MDX must still compile, every `shipeasy …` invocation in
  // it must still exist in the CLI, and the agent bundles (which are stitched
  // FROM this content) must be restitched and carried into the same commit.
  // Without that last step every content edit shows up as drift on the next
  // `pnpm verify:generated`.
  "content/docs/**": () => ["pnpm type-check", "tsx scripts/gen-llms.ts", "git add generated/"],
};
