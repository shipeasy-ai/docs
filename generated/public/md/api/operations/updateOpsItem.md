# Update a queue item

Source: https://docs.shipeasy.ai/api/operations/updateOpsItem

> >-

Update a queue item. The body is validated against the item's stored type: a `bug` accepts its content fields (title, steps-to-reproduce, actual/expected result) plus `status`/`priority`/`notify` and a GitHub PR link; a `feature_request` its content (title, description, use-case) plus the same triage fields; `error`/`alert`/`measure_plan` accept `status`/`priority`/`notify` only (their content is platform-owned). Pass at least one field.

Completing an `error` ticket (status `resolved` or `ready_for_qa`) also resolves the tracked error it links to; the error reopens automatically if it recurs — so completing is safe pre-deploy.

**Use cases**

- **Start working an item** — `{ "status": "in_progress" }`.
- **Hand off for review** — `{ "status": "ready_for_qa" }` once the fix landed (the mode PR-based loops use).
- **Triage** — `{ "priority": "high" }`, content edits on bug/feature items.
