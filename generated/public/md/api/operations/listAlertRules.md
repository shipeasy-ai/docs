# List alert rules

Source: https://docs.shipeasy.ai/api/operations/listAlertRules

> >-

Returns every alert rule in the project (not paginated). Each rule carries its bound `metricId`, the denormalised `metricName` (or `null` if the metric was removed), the comparator/threshold/window, severity, enabled flag, and delivery target.

**Use case:** Audit which metrics have alerting configured — for example to confirm an on-call threshold is set before a launch.
