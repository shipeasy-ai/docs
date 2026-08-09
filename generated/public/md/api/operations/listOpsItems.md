# List the operational queue

Source: https://docs.shipeasy.ai/api/operations/listOpsItems

> >-

Returns the unified ops queue (bugs, feature requests, errors, alerts) in work order — highest priority first, oldest first within a priority — so consumers work it top-down. Filter by `type` and/or `status`, and cap with `limit`. Human-gated holding states (items awaiting human sign-off in the dashboard) are never returned by `all`/default status.

**Use case:** Pull the open queue to triage — e.g. every `bug` still `open` — before working items down one by one.
