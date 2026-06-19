# Authoring Shipeasy docs

This is the contributor guide for `apps/docs` (the Fumadocs site at
`docs.shipeasy.ai`). Read it before adding or restructuring pages so the
information architecture, cross-references, and components stay consistent.

## Information architecture

Tabs are defined by the root `content/docs/meta.json` `pages` order. Each tab is a
folder whose `meta.json` has `"root": true`. Current tabs:

| Tab                 | Folder               | What lives here                                                                                                                                                                                                                                                                |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Get started         | `get-started/`       | Onboarding (`overview`, `quickstart`, `install`, `authenticate`, `sdks`), platform **Concepts** (`keys-and-environments`, `evaluation-and-caching`, `identity-and-bucketing`, `attributes`, `plan-limits`), **Tooling** (`cli*`, `mcp*`), **AI agents** (`agents`, `triggers`) |
| SDKs                | `sdks/`              | `index` + one page per **Language**, then per **Capability** (reasons, onchange, manual-exposure, bucketby, private-attributes, sticky-bucketing, offline-snapshot, testing, devtools-overlay, openfeature)                                                                    |
| Flags & Experiments | `flags-experiments/` | Gates, configs, killswitches, experiments + `case-studies/`, `edge-cases/`, `api/`                                                                                                                                                                                             |
| Metrics & Alerts    | `metrics/`           | Metric DSL (`index`, `quickstart`, `aggregations`, `grammar`, `guardrails`, `power`) + `alerts`                                                                                                                                                                                |
| Bugs & Requests     | `feedback/`          | devtools, error-reporting + `case-studies/`, `edge-cases/`, `api/`                                                                                                                                                                                                             |
| Assistant           | `assistant/`         | `index`, `read-vs-write`, `cards-and-plans`, `measurement-plans`, `credits`, `use-cases`                                                                                                                                                                                       |

**Hidden (built, but not in nav):** `translations/` is intentionally **not** listed
in the root `meta.json`, so the Translations tab is hidden. The pages still build
and are reachable by URL — to bring the tab back, re-add `"translations"` to the
root `pages` array (after `"flags-experiments"` or wherever it belongs) and restore
the home-hub tile/journey in `index.mdx`. Don't delete the folder.

Use **labelled separators** in `meta.json` to group a long sidebar, e.g.
`"---Concepts---"`. A plain `"---"` is an unlabelled divider.

The home hub is `content/docs/index.mdx`, rendered directly at `/` (see
`src/app/[[...slug]]/page.tsx` — do **not** reintroduce a root redirect).

## The footer convention (required on every leaf page)

Every leaf page ends with this trio, in this order:

```mdx
<SeeAlso links={[{ href: "/path", title: "Page title", note: "why it's related" }]} />

<DocNav
  prev={{ href: "/prev", title: "Prev title" }}
  next={{ href: "/next", title: "Next title" }}
/>

<DocFeedback editHref="https://github.com/shipeasy-ai/shipeasy2/edit/main/apps/docs/content/docs/<path>.mdx" />
```

- `<DocNav>` prev/next follow the **sidebar order** in the section's `meta.json`.
- `<SeeAlso>` is for _cross-tab_ relationships the linear prev/next can't express.
- Hub/index pages use `<TileGrid>` / `<CardGrid>` / `<JourneyPath>` instead of `<DocNav>`.

## Components

All components are registered globally in `src/app/[[...slug]]/page.tsx` (no MDX
imports). Defined in `src/components/mdx.tsx`, styled in `src/app/theme.css`.

| Component                                                                                     | Use                                                           |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---- | --------------- | ------ |
| `<Hero eyebrow title subtitle primaryHref primaryLabel secondaryHref secondaryLabel />`       | Top of a tab/section landing page                             |
| `<JourneyPath title goal steps={[{href,label,title}]} />`                                     | Goal → ordered sequence of pages (home hub + product indexes) |
| `<SeeAlso title links={[{href,title,note}]} />`                                               | Related-links footer block                                    |
| `<DocNav prev next />` / `<DocFeedback editHref />` / `<DocMeta status read updated works />` | Leaf-page chrome                                              |
| `<Callout type="info                                                                          | success                                                       | warn | danger" title>` | Asides |
| `<Steps><Step title>`                                                                         | Ordered walkthroughs                                          |
| `<Quickstart title time><QuickstartStep num label title cmd>`                                 | 3-up quickstart grid                                          |
| `<CardGrid><Card href eyebrow title>` / `<TileGrid><Tile href icon title meta>`               | Link grids                                                    |
| `<InstallTabs npm pnpm yarn bun />`                                                           | Package-manager command tabs                                  |
| `<ApiTable><ApiRow name type required optional desc>`                                         | Typed field tables                                            |
| `<DecisionPicker />`                                                                          | The flags/configs/killswitch/experiment chooser               |
| `<Mermaid chart />`                                                                           | Diagrams                                                      |

## Cross-reference matrix

When you add or edit a page, make sure the pages below still link to the relevant
concept. This keeps the web of cross-links intact as content grows.

| Concept page                               | Should be linked from                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `/get-started/overview`                    | home hub, every tab `index` (as "how it works")                         |
| `/get-started/keys-and-environments`       | every SDK language page, `install`, `authenticate`                      |
| `/get-started/identity-and-bucketing`      | `/sdks/bucketby`, `/sdks/sticky-bucketing`, gates/rollouts, experiments |
| `/sdks` (overview)                         | `/get-started/overview`, `/get-started/sdks`, every language page       |
| `/sdks/reasons`                            | `/sdks/openfeature`, gates/rollouts, node/browser pages                 |
| `/sdks/testing` + `/sdks/offline-snapshot` | each other, node-typescript                                             |
| `/sdks/devtools-overlay`                   | `/feedback/devtools`, browser-react, testing                            |
| `/flags-experiments/decision`              | home hub, flags-experiments index                                       |
| `/metrics/power`                           | experiments/analysis, low-traffic case study                            |
| `/metrics/alerts`                          | assistant/measurement-plans, alert-to-ticket case study                 |
| `/assistant/measurement-plans`             | `/feedback`, `/flags-experiments/metrics`, MCP page                     |

## After you change content

1. `pnpm --filter @shipeasy/docs build` — Fumadocs warns on unknown slugs; fix any.
2. **Refresh the assistant index** — the in-product assistant (Jarvis `search_docs`)
   reads a bundled snapshot, not the live site:
   `pnpm --filter @shipeasy/ui gen:docs-index`
   Run this whenever you add, rename, or move a page, or the assistant will cite
   stale URLs.
3. On-site search (`/static.json`) is regenerated automatically by the build.

## Don't

- Don't hand-edit `flags-experiments/api/operations/*` — they're generated by
  `scripts/generate-api-reference.ts` from the OpenAPI spec.
- Don't add a GitHub Actions/CF deploy workflow — `shipeasy-docs` deploys via
  Cloudflare Workers Builds.
- Don't reintroduce the `/` → `/get-started/how-it-works` redirect.
