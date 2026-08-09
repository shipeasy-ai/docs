# Update a fired alert

Source: https://docs.shipeasy.ai/api/operations/updateAlert

> >-

Triage writes on one fired alert — the only mutations this surface allows. All body fields are optional (at least one required); only the fields present are changed.

- **`status`** — flip between `active` / `resolved` / `dismissed`. `resolved` and `dismissed` stamp `resolvedAt` / `dismissedAt`; `active` re-opens and clears both. A resolved alert re-fires (as the same row, re-activated) if its condition is raised again.
- **`assigneeId`** — the PERSON owner (a `users.id`), or `null` to unassign.
- **`agent`** — the AGENT owner: a connected trigger connector's id, or the built-in `"jarvis"` (**Enterprise plan only** — `403` otherwise), or `null` to clear. Person and agent halves are independent.

Returns the updated row; `404` if the alert does not exist in the project.

**Use cases**

- **Wave off a known condition** — `{ "status": "dismissed" }` on an alert that needs no action.
- **Hand it to someone** — `{ "assigneeId": "…" }` from the ops cockpit's Owner column.
