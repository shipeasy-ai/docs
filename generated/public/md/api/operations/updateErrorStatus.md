# Update a tracked error's status

Source: https://docs.shipeasy.ai/api/operations/updateErrorStatus

> >-

Flips the triage state of one error — the only mutation this surface allows. Valid transitions are between `open`, `resolved`, and `ignored`; the body must carry exactly `{ "status": … }`.

A `resolved` error reopens automatically (ingestion-side) if it recurs; `ignored` is sticky until flipped back here. Returns the updated row.

**Use cases**

- **Triage** — `{ "status": "ignored" }` to suppress a known-benign issue from the open list.
- **Close out** — `{ "status": "resolved" }` once the fix lands; it reopens on its own if the error recurs.
