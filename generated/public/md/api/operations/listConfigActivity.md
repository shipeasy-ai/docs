# List config activity

Source: https://docs.shipeasy.ai/api/operations/listConfigActivity

> >-

Returns recent audit rows for one config (create, update, draft.save, publish, delete) ordered newest first. Use the `limit` query parameter to cap the result (1–100, default 20).

**Use case:** Render the activity panel in the config editor or drive a slack notification on publish events.
