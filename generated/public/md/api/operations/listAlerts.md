# List fired alerts

Source: https://docs.shipeasy.ai/api/operations/listAlerts

> >-

Returns the project's FIRED alerts as a **bare JSON array** (no pagination envelope), ordered by `createdAt desc`. Defaults to the currently-firing ones (`status=active`); pass a `status` to widen to resolved/dismissed history or `all`.

A fired alert is an **instance** of an alert rule, and an instance IS its ops queue item — the same row `/api/admin/ops` returns with `type: "alert"`, viewed through the alert lens. One rule produces many instances over its life and at most one is open at a time: when the condition clears the instance closes, and the next firing is a NEW instance with its own id and history. That is why `severity` reads off the rule (the queue item carries it as `priority`) and why resolving the queue item and clearing the alert are one act, not two rows to keep in step.

Instances are opened only by the platform — the UI's killswitch handlers plus the worker's analysis consumer and alerts cron — never filed by hand, so this surface is list + triage (via PATCH), with no create. The rules that *define* metric-threshold alerts live at `/api/admin/alert-rules`.

**Use case:** Snapshot what is currently firing for an on-call view or the home Alerts block, or pull `status=all` to audit how a noisy rule has behaved over time.
