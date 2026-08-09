# Authoring Shipeasy docs

This is the contributor guide for the Fumadocs site at `docs.shipeasy.ai`. Read
it before adding or restructuring pages so the information architecture,
cross-references, and components stay consistent.

For the repo layout, the gates, and how generated pages work, start at
[`README.md`](README.md) and [`generated/README.md`](generated/README.md).

## Information architecture

Tabs are defined by the root `content/docs/meta.json` `pages` order. Each tab is a
folder whose `meta.json` has `"root": true`. Current tabs:

| Tab              | Folder         | What lives here                                                                                                                                                                                                                                                         |
| ---------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Get started      | `get-started/` | Onboarding (`overview`, `quickstart`, `install`, `authenticate`, `sdks`), platform **Concepts** (`keys-and-environments`, `evaluation-and-caching`, `identity-and-bucketing`, `attributes`), **Tooling** (`cli*`, `mcp*`), **AI agents** (`agents`, `llms`, `triggers`) |
| SDKs             | `sdks/`        | `index` + one page per **Language**, then per **Capability** (reasons, onchange, manual-exposure, bucketby, private-attributes, sticky-bucketing, offline-snapshot, testing, devtools-overlay, openfeature)                                                             |
| Flags & Configs  | `flags/`       | Gates, configs, killswitches + `case-studies/`, `edge-cases/`                                                                                                                                                                                                           |
| Metrics & Alerts | `metrics/`     | Metric DSL (`index`, `quickstart`, `aggregations`, `grammar`) + `alerts`                                                                                                                                                                                                |
| API              | `api/`         | Authored `index` + the generated `operations/` tree                                                                                                                                                                                                                     |
| Bugs & Requests  | `feedback/`    | devtools, error-reporting + `case-studies/`, `edge-cases/`, `api/`                                                                                                                                                                                                      |
| Assistant        | `assistant/`   | `index`, `read-vs-write`, `cards-and-plans`, `measurement-plans`, `credits`, `use-cases`                                                                                                                                                                                |

**Hidden (not built at all):** i18n and experiments are parked under
`content/_hidden/`, outside the Fumadocs content root — so they don't compile,
don't index, and don't export. Old URLs 302 via `public/_redirects`. The full
list, and the exact steps to un-hide a product, are in
[`content/_hidden/README.md`](content/_hidden/README.md). Don't delete the
folder, and don't reintroduce experiment vocabulary into the live pages — the
scrub is deliberate.

Use **labelled separators** in `meta.json` to group a long sidebar, e.g.
`"---Concepts---"`. A plain `"---"` is an unlabelled divider.

The home hub is `content/docs/index.mdx`, rendered directly at `/` (see
`src/app/[[...slug]]/page.tsx` — do **not** reintroduce a root redirect).

## The footer convention (required on every leaf page)

One block, at the very end of the page:

```mdx
<SeeAlso links={[{ href: "/path", title: "Page title", note: "why it's related" }]} />
```

- `<SeeAlso>` is for the relationships the linear prev/next can't express — the
  deep-dive, the reference, the worked example, the page in another tab.
- Hub/index pages use `<TileGrid>` / `<CardGrid>` / `<JourneyPath>` instead.
- Don't hand-place prev/next, the feedback row, the copy-as-markdown buttons or
  the updated date. `DocPageView` renders all four on every page, so they can't
  be forgotten and can't be doubled. Prev/next follows the **sidebar order** in
  the section's `meta.json`; the date comes from `generated/data/updated.json`,
  which the pre-commit hook stamps — never type a date into a page.

## Components

All components are registered globally in `src/lib/doc-page.tsx` (no MDX
imports). Defined in `src/components/mdx.tsx`, styled in `src/app/theme.css`.

| Component | Use |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---- | --------------- | ------ |
| `<Hero eyebrow title subtitle primaryHref primaryLabel secondaryHref secondaryLabel />` | Top of a tab/section landing page |
| `<JourneyPath title goal steps={[{href,label,title}]} />` | Goal → ordered sequence of pages (home hub + product indexes) |
| `<SeeAlso title links={[{href,title,note}]} />` | Related-links footer block |
| `<DocMeta status read works />` | Leaf-page chrome (the date is not yours to set — see above) |
| `<Callout type="info                                                                          | success                                                       | warn | danger" title>` | Asides |
| `<Steps><Step title>` | Ordered walkthroughs |
| `<Quickstart title time><QuickstartStep num label title cmd>` | 3-up quickstart grid |
| `<CardGrid><Card href eyebrow title>` / `<TileGrid><Tile href icon title meta>` | Link grids |
| `<InstallTabs npm pnpm yarn bun />` | Package-manager command tabs |
| `<ApiTable><ApiRow name type required optional desc>` | Typed field tables |
| `<DecisionPicker />` | The flags/configs/killswitch/experiment chooser |
| `<Mermaid chart />` | Diagrams |

## Cross-reference matrix

When you add or edit a page, make sure the pages below still link to the relevant
concept. This keeps the web of cross-links intact as content grows.

| Concept page                               | Should be linked from                                             |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `/get-started/overview`                    | home hub, every tab `index` (as "how it works")                   |
| `/get-started/keys-and-environments`       | every SDK language page, `install`, `authenticate`                |
| `/get-started/identity-and-bucketing`      | `/sdks/bucketby`, gates/rollouts, flags/edge-cases                |
| `/sdks` (overview)                         | `/get-started/overview`, `/get-started/sdks`, every language page |
| `/sdks/reasons`                            | `/sdks/openfeature`, gates/rollouts, node/browser pages           |
| `/sdks/testing` + `/sdks/offline-snapshot` | each other, node-typescript                                       |
| `/sdks/devtools-overlay`                   | `/feedback/devtools`, browser-react, testing                      |
| `/flags/decision`                          | home hub, flags index                                             |
| `/metrics/grammar`                         | metrics index, metrics/quickstart, metrics/alerts                 |
| `/metrics/alerts`                          | assistant/measurement-plans, alert-to-ticket case study           |
| `/assistant/measurement-plans`             | `/feedback`, `/metrics`, MCP page                                 |

## After you change content

1. `pnpm type-check` — compiles the MDX and validates every `shipeasy …`
   invocation against the real CLI tree. The `pre-commit` hook runs this.
2. `pnpm build && pnpm check-links` — the dead-link sweep, over the real export.
   The `pre-push` hook runs this; run it yourself after moving or renaming a page.
3. **Refresh the assistant index** in the `shipeasy` repo — the in-product
   assistant (`search_docs`) reads a bundled snapshot, not the live site:
   `pnpm --filter @shipeasy/assistant-core gen:docs-index`. Run it whenever you
   add, rename, or move a page, or the assistant will cite URLs that 404.
4. On-site search (`/static.json`) is regenerated automatically by the build.

## Don't

- Don't hand-edit anything under `generated/` or its mirrored destinations —
  read [`generated/README.md`](generated/README.md) first. The mirrors are
  gitignored precisely so a hand-edit can't be committed.
- Don't add a GitHub Actions/CF **deploy** workflow — `shipeasy-docs` deploys via
  Cloudflare Workers Builds. (`.github/workflows/regen.yml` is not a deploy; it
  regenerates reference content.)
- Don't reintroduce the `/` → `/get-started/how-it-works` redirect.
- Don't learn a CLI command, MCP tool, or API operation name from prose — cite
  the generated reference. Every hand-written tool list in this repo's history
  eventually went stale, which is why they're gone.
- **Don't state a price, plan cap, included allowance, overage rate, seat count
  or retention window.** Not in a table, not in an aside, not as "the free tier
  covers this". Say the behaviour is plan-derived and link
  `https://shipeasy.ai/pricing`; the dashboard's **Billing** tab is the live
  authority. Two pages that did carry the numbers are parked in
  `content/_hidden/` and their URLs redirect to the pricing page.
