# Shipeasy docs

The Fumadocs site behind **[docs.shipeasy.ai](https://docs.shipeasy.ai)**. Next.js
(static export) on a Cloudflare Worker.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

`predev` and `prebuild` run `scripts/sync-generated.ts` first, which copies the
committed machine-written pages into the content tree. A fresh clone will not
build without it — that is by design; see below.

## Layout

```
content/docs/      authored pages — the site's information architecture
content/_hidden/   parked products (i18n, experiments) — built by nothing, deleted by nobody
generated/         machine-written pages, mirrored into content/docs/ at build time
scripts/           the generators, the mirror, and the gates
src/               the Next app: layout, MDX components, theme
public/_redirects  every URL we have ever moved
```

## Generated vs authored

**Read `generated/README.md` before touching anything under `generated/`.** Short
version: every file there comes from a source of truth in another repo, is copied
into `content/docs/` by `pnpm sync`, and is overwritten by the next regeneration.
The destinations are gitignored so a hand-edit cannot be committed.

| What                                | Owned by                      | Regenerate with                                    |
| ----------------------------------- | ----------------------------- | -------------------------------------------------- |
| `/api/operations/*`                 | the OpenAPI spec (`shipeasy`) | `pnpm gen:api` (here)                              |
| `/sdks/reference/*`, `/sdks/<lang>` | each `shipeasy-ai/sdk-*` repo | `pnpm gen:sdk` (here)                              |
| `/get-started/cli-reference`        | the CLI's Commander tree      | `pnpm --filter @shipeasy/cli docs` (in `shipeasy`) |
| `/get-started/mcp-reference`        | the MCP tool catalog          | `pnpm --filter @shipeasy/mcp docs` (in `shipeasy`) |

`pnpm gen:sdk` reads the SDK repos over GitHub by default. Point it at local
checkouts to see unpushed edits:

```bash
SHIPEASY_SDK_ROOT=~/projects/shipeasy/packages/server-sdks pnpm gen:sdk
```

The marketplace-owned pages are **pushed** here rather than pulled — that repo's
`pre-push` hook writes into a local checkout of this one automatically. See
`docs/GENERATION.md` for the whole freshness story.

## Gates

| Command                 | Catches                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `pnpm type-check`       | MDX that won't compile, and `shipeasy …` invocations the CLI doesn't have |
| `pnpm check-links`      | internal links into a hole (needs `pnpm build` first)                     |
| `pnpm verify:generated` | a hand-edited generated file, or an upstream source that moved            |
| `pnpm lint`             | the usual                                                                 |

`pre-commit` runs `type-check` on changed content; `pre-push` runs the full build
plus the link sweep. Enable them with `pnpm install` (its `prepare` sets
`core.hooksPath`).

## Authoring

`CONTRIBUTING-docs.md` has the information architecture, the required page
footer (`SeeAlso` / `DocNav` / `DocFeedback`), the component inventory, and the
cross-reference matrix.

## Deploy

Cloudflare Workers Builds deploys the `shipeasy-docs` Worker on every push to
`main` — there is no deploy workflow in this repo, and there must not be one.
`wrangler.jsonc` serves `out/` as Workers Assets on `docs.shipeasy.ai`.

|        |                                                         |
| ------ | ------------------------------------------------------- |
| Build  | `pnpm install --frozen-lockfile && pnpm build`          |
| Deploy | `pnpm exec wrangler deploy`                             |
| Root   | `/` — no path filters; every push here is a docs change |

Out of band: `pnpm deploy` from a checkout does the same two steps.

**Read the build log, not the outcome.** The trigger this replaced still pointed
at the monorepo path this site used to live at, and ran `pnpm --filter
@shipeasy/docs …`. A pnpm filter that matches nothing exits 0, so every build
reported success while building and deploying nothing — the site sat stale for
days with a green tick over it. A build that did real work says
`Uploaded … files` and prints a version id.
