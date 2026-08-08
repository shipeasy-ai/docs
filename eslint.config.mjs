import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * React correctness rules pinned to `error`. Inlined here when the docs site
 * left the shipeasy monorepo (it used to import them from the root config);
 * keep in sync with `eslint.config.mjs` in shipeasy2 if that set changes.
 */
const reactErrorRules = {
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "react/jsx-key": "error",
    "react/no-unescaped-entities": "error",
    "react/no-children-prop": "error",
    "react/no-danger-with-children": "error",
    // `rel="noopener"` closes reverse tabnabbing and stays required.
    // `noreferrer` is not: every external href here is one we hardcode, and
    // stripping the Referer is the strongest "disguised popunder" marker there
    // is — popup blockers cancel the click and the link reads as dead.
    "react/jsx-no-target-blank": ["error", { allowReferrer: true }],
  },
};

export default [
  // `generated/` and its mirrored destinations are machine output — linting
  // them reports on a generator, not on code anyone can fix here.
  {
    ignores: [
      ".next/**",
      "out/**",
      ".source/**",
      "generated/**",
      "content/docs/api/operations/**",
      "content/docs/sdks/reference/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { files: ["**/*.{ts,tsx,js,jsx}"], ...reactErrorRules },
];
