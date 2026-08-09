# List fired alerts

Source: https://docs.shipeasy.ai/api/operations/listAlerts

> >-

Returns the project's FIRED alerts as a **bare JSON array** (no pagination envelope), ordered by `createdAt desc`. Defaults to the currently-firing ones (`status=active`); pass a `status` to widen to resolved/dismissed history or `all`.

Fired alerts are raised only by the platform — the UI's killswitch handlers plus the worker's analysis consumer and alerts cron — never filed by hand, so this surface is list + triage (via PATCH), with no create. The rules that *define* metric-threshold alerts live at `/api/admin/alert-rules`.

**Use case:** Snapshot what is currently firing for an on-call view or the home Alerts block, or pull `status=all` to audit how a noisy rule has behaved over time.
