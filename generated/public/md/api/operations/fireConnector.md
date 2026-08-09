# Fire a trigger connector

Source: https://docs.shipeasy.ai/api/operations/fireConnector

> >-

Manually kicks a trigger connector's run — Claude (kicks its preconfigured routine) or Cursor / Copilot / Jules (launches a cold cloud-agent run). Firing is event-less: it kicks the run with an optional caller-supplied prompt override rather than dispatching a single lifecycle payload.

Only trigger providers can be fired, and only once authenticated (a tokenless trigger cannot fire). The attempt's outcome is recorded on the connector's `lastAttemptAt` / `lastError` / `lastSuccessAt`.

**Use case:** Kick a one-off ops sweep on demand from the dashboard's "Fire now" button, optionally overriding the routine's default prompt.
