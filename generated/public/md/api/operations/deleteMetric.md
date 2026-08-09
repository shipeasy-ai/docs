# Archive a metric

Source: https://docs.shipeasy.ai/api/operations/deleteMetric

> >-

Soft-deletes (archives) the metric. Returns `409` if it is attached to a running experiment — stop those experiments first.

**Use case:** Retire a metric once no running experiment depends on it (the user-facing verb is `archive`).
