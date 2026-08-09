# File a queue item

Source: https://docs.shipeasy.ai/api/operations/createOpsItem

> >-

Files one queue item — a bug report or a feature request — and fires the project's connectors (GitHub issue / Slack). `type` selects which; only the two user-fileable types are accepted (`error`/`alert` tickets are auto-filed by the platform). Returns the new id and per-project number.

**Use cases**

- **File a bug** — `{ "type": "bug", "title": "Checkout 500s on Safari", "stepsToReproduce": "…" }`.
- **File a feature request** — `{ "type": "feature_request", "title": "Dark mode", "priority": "nice_to_have" }`.
