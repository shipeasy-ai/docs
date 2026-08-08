# How generated docs stay fresh

Four reference surfaces on this site are machine-written from sources that live
in other repos. Left alone they rot silently: the page keeps rendering, it just
stops being true. This is the machinery that stops that.

```
shipeasy-ai/shipeasy  (marketplace/)          shipeasy-ai/sdk-*  (8 repos)
        │                                              │
        │ pre-push hook, when openapi/cli/mcp changed  │ pre-push hook, when docs/ changed
        │                                              │
        ├── writes generated/content/get-started/*     └── triggers `pnpm gen:sdk` here,
        │   + generated/data/cli-commands.json             which reads the local checkout
        │   into a local checkout of THIS repo             (SHIPEASY_SDK_ROOT) or GitHub
        │
        ▼
   shipeasy-ai/docs      ──►  scripts/sync-generated.ts  ──►  content/docs/**  ──►  build
        ▲
        │ nightly workflow: re-run pnpm gen, commit if anything drifted
```

Two mechanisms, deliberately overlapping.

## 1. Local hooks — the fast path

Each source repo knows when it has changed something the docs describe, and acts
at `git push` time, because that is the moment the change becomes real for
everyone else.

**`shipeasy` (the monorepo).** `.githooks/pre-push` checks whether the pushed
range touched `marketplace/openapi`, `marketplace/cli`, or `marketplace/mcp`. If
so it runs the CLI and MCP doc generators, which write straight into a checkout
of this repo, and tells you to commit and push them.

**Each `sdk-*` repo.** `.githooks/pre-push` checks whether the pushed range
touched `docs/`. If so it runs this repo's `pnpm gen:sdk` against the local
checkout, so the regenerated reference reflects what you are pushing.

Both hooks find this repo by, in order:

1. `$SHIPEASY_DOCS_REPO`;
2. a sibling checkout (`../docs`, `../shipeasy-docs`);
3. `~/projects/shipeasy-docs`.

If none exists the hook prints where it looked and exits 0 — it never blocks a
push over a missing optional checkout. The nightly job below is what makes that
safe.

## 2. Nightly workflow — the safety net

`.github/workflows/regen.yml` runs `pnpm gen` on a schedule (and on
`repository_dispatch`, and on demand), then commits anything that changed. It
reads the SDK repos over GitHub and the OpenAPI spec from the published
`@shipeasy/openapi`, so it needs no local checkouts at all.

This is what covers every way the hooks can be skipped: `--no-verify`, a fresh
clone with no `core.hooksPath`, a change landed straight on GitHub, or a
contributor who simply doesn't have this repo checked out.

## 3. Drift gate — the proof

`pnpm verify:generated` re-runs the docs-owned generators into a scratch copy and
fails if the committed output differs. It catches the two failures the other two
mechanisms can't:

- somebody hand-edited a file under `generated/`;
- an upstream source moved and nothing regenerated.

The nightly workflow effectively runs this every day; run it yourself before a
release if you want certainty.

## Adding a new generated surface

1. Emit into `generated/content/<the path it should have on the site>`.
2. Add a `MIRRORS` row in `scripts/generated-map.ts`.
3. Add the destination to `.gitignore`, `.prettierignore`, and the `ignores`
   list in `eslint.config.mjs`.
4. Add a row to the table in `generated/README.md`.
5. If the generator lives here, add it to the `gen` script and to the loop in
   `scripts/verify-generated.ts`. If it lives in a source repo, extend that
   repo's `pre-push` hook instead.

## Why not submodules

An earlier design vendored the SDK repos and the marketplace repo as submodules
so the generators could read them locally. That buys unpushed-`main` visibility
at the cost of a gitlink bump on every SDK docs edit, and a clone that fails
confusingly when somebody forgets `--recurse-submodules`. Pulling published
sources over the network, with an env-var escape hatch for local work, gets the
same output with none of that.
