# File a feature request

Source: https://docs.shipeasy.ai/api/operations/createPublicFeatureRequest

> >-

Files one feature request onto a project's queue, awaiting human approval. The feature-request counterpart to `POST /ops/bug`, with the same three gates: a `client` key carrying `tickets:public_create`, a project that has opted in, and a `pending_approval` state forced server-side.

The project is the key's own project; there is no `X-Project-Id` to pass. Repeat submissions of the same title dedupe against the open ticket already tracking it, which returns `200` with `deduped: true` instead of filing again.

This endpoint is served by the Shipeasy **edge worker** (`api.shipeasy.ai`), not the admin API — see `servers` below.

**Use case:** An in-product "request a feature" form posts what the user asked for — `{ "title": "Dark mode", "useCase": "Reduce eye strain at night" }`.
