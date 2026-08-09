# Get an error's occurrence series

Source: https://docs.shipeasy.ai/api/operations/getErrorSeries

> >-

Returns a bucketed occurrence timeseries for one tracked error (by its fingerprint), read from the `shipeasy_errors` Analytics Engine dataset (near-real-time; ingest lag is seconds). The window bounds are epoch **seconds**; `to` must be strictly greater than `from`. The response echoes the SQL that produced the rows.

**Use case:** Render the trend sparkline / occurrence chart on the error detail panel, or pull the raw bucketed counts to alert when an issue's rate spikes.
