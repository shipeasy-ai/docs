# Delete an alert rule

Source: https://docs.shipeasy.ai/api/operations/deleteAlertRule

> >-

Deletes the alert rule. The cron stops evaluating it immediately. Use this (then create a new rule) to repoint alerting at a different metric, since `metricId` is immutable.

**Use case:** Remove an alert rule that is no longer needed, or as the first half of repointing a rule at a different metric.
