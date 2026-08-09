# Create an alert rule

Source: https://docs.shipeasy.ai/api/operations/createAlertRule

> >-

Creates a metric-threshold alert rule. `name`, `metricId`, `comparator`, and `threshold` are required; `windowHours` defaults to `24`, `severity` to `warn`, and `enabled` to `true`.

Returns `404` if `metricId` does not resolve, and `400` for a metric with no scalar form over a window (e.g. retention metrics) — the cron can't evaluate those.

**Use cases**

- **Threshold alert** — warn when an error/latency metric crosses a value over a rolling window.
- **Routed alert** — set `notify` to page a specific Slack channel or on-call email instead of the project default.
