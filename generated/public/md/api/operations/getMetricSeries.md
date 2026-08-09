# Get a metric's time series

Source: https://docs.shipeasy.ai/api/operations/getMetricSeries

> >-

Compiles the metric's typed IR into Analytics Engine SQL and returns the bucketed series over the requested window (near-real-time; ingest lag is seconds). The window bounds are epoch **seconds**; `to` must be strictly greater than `from`. The response echoes the SQL that produced the rows.

Returns `422` when the stored definition can't compile (e.g. a label or event has gone away — re-save the metric), and `502`/`503` when the analytics upstream fails or isn't configured.

**Use case:** Render the metric trend chart / sparkline, or pull raw bucketed values to feed an external dashboard.
