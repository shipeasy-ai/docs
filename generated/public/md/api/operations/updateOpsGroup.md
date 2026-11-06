# Update a linked group

Source: https://docs.shipeasy.ai/api/operations/updateOpsGroup

> >-

Applies `status` and/or `priority` to every item in this item's link group — the items tied to it, directly or through a chain, by blocked-by / blocking / duplicate-of links (see `group` on `ops get`). Each member goes through the normal item update, so activity, audit, run close-out and the error sync happen exactly as for a one-item edit. Members already in the requested state are left alone. An item with no links is a group of one.

**Use cases**

- **The fix landed for the whole group** — `{ "status": "resolved" }` on any member.
- **Drop the group** — `{ "status": "wont_fix" }`.
- **Escalate it together** — `{ "priority": "critical" }`.
