# Update an alert rule

Source: https://docs.shipeasy.ai/api/operations/updateAlertRule

> >-

Partial update of a rule's tunable knobs. `metricId` is immutable — the metric also pins the aggregation, so a body carrying `metricId` is rejected with `409 IMMUTABLE_FIELD`; create a new rule bound to the other metric instead (rule deletion is dashboard-only).

Pass `"notify": null` to revert the rule's delivery target back to the project default.

**Use cases**

- **Tune sensitivity** — change `threshold`/`comparator`/`windowHours` as the metric's baseline shifts.
- **Pause without losing config** — `{ "enabled": false }` instead of deleting the rule.
