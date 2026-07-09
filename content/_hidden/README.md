# Hidden docs content

Content parked outside the `content/docs/` build tree so fumadocs does not
compile, index, or export it. The i18n/Translations product is hidden from all
public surfaces (2026-07 pricing restructure — dashboard is behind the internal
`translations` gate, docs URLs 302 via `public/_redirects`).

To re-enable: move `translations/` back to `content/docs/translations`, move
`llms-i18n-strings.mdx` back to `content/docs/llms/i18n-strings.mdx`, restore
the nav entries (root `meta.json`, `llms/meta.json`, `product-switcher.tsx`,
`layout.tsx` PRODUCT_DESCRIPTIONS), and drop the `_redirects` rules.
