# Update a connector

Source: https://docs.shipeasy.ai/api/operations/updateConnector

> >-

Partial update — only supplied fields change. `events` and `config` **replace** wholesale; there is no merge or append. Secrets cannot be set through this endpoint (credential rotation goes through the provider-specific re-register flow).

The response carries only `{ id }` — re-fetch via `GET /api/admin/connectors/{id}` for the new row.

**Use cases**

- **Pause a connector** — `{ "enabled": false }`. Stops all dispatch / auto-fire without deleting it.
- **Change subscribed events** — send the full new `events` array. An empty array unsubscribes the connector from every event.
- **Rename** — `{ "name": "Bugs → acme/app issues" }`.
- **Retarget** — send a new `config` (e.g. a different Sheets `sheetTitle`); it replaces the stored config wholesale.
