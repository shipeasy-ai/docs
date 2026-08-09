# Flow & dependencies

Source: https://docs.shipeasy.ai/flags/flow

> A live dependency graph of your events, metrics, and alerts — trace what feeds what before you change it.

**Flow** is a live graph of how your instrumentation hangs together: events feed metrics, and metrics drive alerts. It lives in the dashboard at `/dashboard/<projectId>/flow`. Use it to see the blast radius of a change before you make it — which alerts watch a metric, and which event that metric is built on.

Read it left to right: an **event** is aggregated (`agg`) into a **metric**, and an **alert** rule watches that metric with a comparator, threshold, and window. That's the whole vocabulary — three node types, two edge kinds.

## What the graph shows

The graph is assembled server-side from your project's real lists — events, metrics, alert rules, and currently-active alerts — and re-fetched after every write, so it always matches the underlying resources.

The node types and the edges between them describe the data pipeline:

| Node           | Edge into it         | What the edge means                                                                                            |
| -------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Event**      | —                    | A logged event (or an SDK auto-event like `__auto_lcp`).                                                       |
| **Metric**     | `agg`                | The metric aggregates this event (`count`, `sum(value)`, `p95(value)`, a `ratio` of two events, …).            |
| **Alert**      | `alert`              | An alert rule watches this metric, with its comparator/threshold/window shown on the edge (e.g. `> 200 · 1h`). |

> **Status is live**

Alert nodes render as **firing**, **armed**, or **paused**. Metric and event nodes are enriched with live analytics — a 7-day sparkline, current
value, and period delta on metrics, and a per-day volume on events. Enrichment is cached ~1 hour;
the graph structure itself is rebuilt on every view, so newly-created resources appear
immediately.

## How nodes cluster

Nodes group into **clusters**. If you use folders, the folder is the cluster. Otherwise Flow auto-clusters by connectivity — each event → metric → alert pipeline becomes its own self-contained band, named after its hub (the highest-degree metric). Unconnected SDK auto-events are hidden until a metric reads them, so the canvas stays clean.

## Impact analysis before a change

The point of Flow is to answer "what depends on this?" before you touch a metric or an event.

**Find the node**

Open **Flow** and locate the metric or event you're about to change. Drag to rearrange and
hover to trace its edges.

**Read its downstream edges**

Follow the edges *out* of the node. An `alert` edge means an alert rule is armed on that
metric — renaming the event it aggregates, or changing the metric's query, moves the number the
rule is comparing against, and a rule that was quiet can start (or stop) paging.

**Check what feeds it**

Follow the edges *in*. A metric's `agg` edge names the exact event and aggregation it reads — so
you know which event you must keep emitting.

> **Changing an upstream resource ripples**

If you stop logging an event, every metric with an `agg` edge from it goes blank, and every alert
downstream of those metrics loses its data. Trace the chain in Flow first — the edges show you
exactly which resources to update together.

## Building from a node

Flow isn't read-only. From a node you can spin up the next resource in the pipeline — add an SDK auto-event from the top-bar catalog (which also creates the metric that reads it), or create a downstream alert rule that's pre-attached to a metric. The new resource is created against the same folder and shows up in the graph on the next reload.

**Related**

- [Threshold alerts](https://docs.shipeasy.ai/metrics/alerts) — The alert edges in Flow are these rules.
- [Gates vs configs vs killswitches](https://docs.shipeasy.ai/flags/decision) — How the pieces fit together conceptually.
