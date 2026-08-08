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

  // Content changed → MDX must still compile and every `shipeasy …` invocation
  // in it must still exist in the CLI.
  "content/docs/**": () => ["pnpm type-check"],
};
