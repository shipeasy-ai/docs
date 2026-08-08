# Hidden docs content

Content parked outside the `content/docs/` build tree so Fumadocs does not
compile, index, or export it. Nothing here is deleted — hiding a product is a
move plus a few nav edits, and un-hiding it is the same move backwards.

## What is parked, and why

| Path                                          | Product     | Hidden since                                                                                                                                                        |
| --------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `translations/`, `llms-i18n-strings.mdx`      | i18n        | 2026-07 pricing restructure — dashboard is behind the `translations` internal gate                                                                                  |
| `experiments/`                                | Experiments | 2026-08 — the whole A/B product is off every public surface                                                                                                         |
| `case-studies/*`                              | Experiments | 2026-08 — the six experiment-only case studies                                                                                                                      |
| `power.mdx`, `guardrails.mdx`                 | Experiments | 2026-08 — power/MDE and primary-vs-guardrail are experiment concepts                                                                                                |
| `manual-exposure.mdx`, `sticky-bucketing.mdx` | Experiments | 2026-08 — both pages are about experiment exposure/enrolment                                                                                                        |
| `llms/`                                       | —           | 2026-08 — its only shipped runbook was the i18n one, and its tool names had gone stale. Superseded by the generated `/get-started/llms` page + `llms.txt` endpoints |
| `plan-limits.mdx`, `billing.mdx`              | Pricing     | 2026-08 — every price, cap and allowance now lives on shipeasy.ai/pricing only                                                                                      |

### Prices and limits

Docs carry **no** prices, plan caps, included allowances, overage rates or
retention windows — those move faster than a docs push and were already wrong
here twice. `shipeasy.ai/pricing` and the dashboard's **Billing** tab are the
only places that state a number; `public/_redirects` sends the two old doc URLs
there. When a page needs to mention that something is plan-derived, say so and
link the pricing page — never reproduce the number.

## Un-hiding a product

1. `git mv` the folder back under `content/docs/`.
2. Restore its nav entries — the root `content/docs/meta.json`, the section's own
   `meta.json`, and any `<Tile>` / `<Card>` / `<JourneyPath>` that used to point
   at it.
3. Drop the matching rules from `public/_redirects`.
4. For **experiments** specifically, also flip the generators, which filter it
   out at three points:
   - `scripts/gen-api-reference.ts` — the `isHidden` regex in `beforeWrite`
     drops `*Experiment*` / `*Universe*` operation pages.
   - `scripts/gen-sdk-reference.ts` — `HIDDEN_PAGES` / `HIDDEN_SNIPPETS` drop
     the per-SDK experiments page and its snippet.
   - `marketplace/{cli,mcp}/scripts/gen-*-docs.ts` in the `shipeasy` repo —
     `HIDDEN_DOCS_GROUPS` drops the experiment commands and tools from the
     generated CLI/MCP reference.
     Then `pnpm gen` here and re-run the marketplace generators there.
5. `pnpm build && pnpm check-links` — the link checker is what tells you which
   cross-references you missed.

Experiments and i18n are hidden from the **docs**, not removed from the
product: the API operations, CLI commands, MCP tools and SDK methods all still
exist and still work.
