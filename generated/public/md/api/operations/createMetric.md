# Create a metric

Source: https://docs.shipeasy.ai/api/operations/createMetric

> >-

Creates an event-backed metric. Pass the query as the DSL string (`query`) **or**
the typed IR (`query_ir`) — exactly one. `event_name` must equal the event the
query references.

Returns `409` if a metric with the same `name` already exists, and `422` if the
query is invalid or references an unregistered event / label.

**Use cases**

- **Track an event** — `count_users(<event>)` for unique-user counts.
- **Sum a value** — `sum(<event>, <label>)` for revenue / quantity metrics.
- **Experiment success metric** — create the metric, then attach its id to an experiment.
