# List tracked errors

Source: https://docs.shipeasy.ai/api/operations/listErrors

> >-

Returns a single page of tracked production errors as a **bare JSON array** (no pagination envelope), ordered by `lastSeenAt desc`. Filter with `status`, free-text-search with `q`, and cap the page with `limit`.

Tracked errors are never filed by hand — an ingestion path (worker log drain / the `see()` SDK reporter) folds each occurrence into a row keyed by `fingerprint`, bumping `count` and `lastSeenAt`. This surface only reads them and (via PATCH) flips their `status`.

**Use case:** Snapshot the project's open issues for a triage dashboard, or drive a CI gate that fails the build when any `open` error of `kind: uncaught` exists in `prod`.
