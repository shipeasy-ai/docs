# Update a trigger connector

Source: https://docs.shipeasy.ai/api/operations/updateTriggerConnector

> >-

Edit an existing coding-agent **trigger** connector (`claude_trigger` / `cursor_trigger` / `copilot_trigger` / `jules_trigger`) — replace its non-secret `config` and, optionally, rotate its credential secret(s). Discriminated on `provider`; the id in the path selects the connector and its `provider` must match the body.

Unlike the generic `PATCH /api/admin/connectors/{id}` (which cannot touch secrets), this endpoint always replaces the non-secret `config` wholesale and merges any supplied secret over the stored credential cipher — so a single half of a two-key pair (e.g. just the ops key) can be rotated on its own. A blank/omitted secret leaves the stored cipher untouched.

The response carries only `{ id }` — re-fetch via `GET /api/admin/connectors/{id}` for the new row.

**Use case:** Re-point a Cursor trigger at a new repo ref, or rotate a Claude trigger's fire token, without deleting and re-creating the connector.
