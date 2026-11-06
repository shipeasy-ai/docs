# List the operational queue

Source: https://docs.shipeasy.ai/api/operations/listOpsItems

> >-

Returns the unified ops queue (bugs, feature requests, errors, alerts, measurement plans) in work order — highest priority first, oldest first within a priority — so consumers work it top-down. Every filter is applied in SQL before paging, and filters combine with AND. Human-gated holding states (items awaiting human sign-off in the dashboard) are never returned by `all`/default status.

**Filters:** `type` (one item type), `status` (one lifecycle status, or `unresolved` — everything not yet `resolved`/`wont_fix`), `priority` (one triage priority), `owner` (one person or agent), `reporter` (one filer's email), `closedSince` (drop items closed before a time), and `scope=ready` — the items ready to be picked up right now: `open`, with nobody working them (no open run), and either unowned or reopened (sent back to `open` after an earlier run finished).

**Paging:** `limit` is the page size and `offset` the number of items to skip. The order is stable, so walk the queue with `offset += limit`; a page shorter than `limit` is the last one.

**Use case:** Pull the open queue to triage — e.g. every `bug` still `open` — before working items down one by one.
