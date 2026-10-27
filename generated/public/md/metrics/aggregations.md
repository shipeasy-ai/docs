# Aggregation functions

Source: https://docs.shipeasy.ai/metrics/aggregations

> The eleven aggregation functions — count, sum, average, minimum, maximum, std dev and the p50 to p99 percentiles — plus rates, outlier handling, and how to pick one.

A **metric** reduces the events you log into a number the platform charts over time and alert rules
compare. The **aggregation function** is the reduction: count the events, add up a property, take
its average, read its 95th percentile. Pick the one that matches the question and the series tells
the truth; pick the wrong one and a single outlier can swing it.

## The eleven functions

The **Aggregate** dropdown on the **New metric** form lists exactly these. The dashboard says
_average_; the query language says `avg`.

| In the dropdown | DSL      | Per bucket, it computes              | Best for                             |
| --------------- | -------- | ------------------------------------ | ------------------------------------ |
| count           | `count`  | Number of events                     | Page views, sessions, clicks, errors |
| sum             | `sum`    | Sum of a numeric property            | Revenue, time spent, items added     |
| average         | `avg`    | Mean of a numeric property           | Order value, session length          |
| minimum         | `min`    | Smallest value of a numeric property | Fastest response, lowest basket      |
| maximum         | `max`    | Largest value of a numeric property  | Slowest response, biggest payload    |
| std dev         | `stddev` | Spread of a numeric property         | How consistent latency or size is    |
| p50             | `p50`    | Median of a numeric property         | The typical request                  |
| p75             | `p75`    | 75th percentile                      | The slower quarter                   |
| p90             | `p90`    | 90th percentile                      | Tail latency                         |
| p95             | `p95`    | 95th percentile                      | The usual latency SLO                |
| p99             | `p99`    | 99th percentile                      | The worst one request in a hundred   |

Every function except `count` takes a numeric property of the event as its second argument:
`avg(purchase, revenueCents)`, `p95(page_view, loadTimeMs)`. `count` counts rows and takes none.
For a percentile that isn't in the list, write `p(97.5, event, property)`; `p999` is shorthand for
the 99.9th. The full grammar is on the [DSL page](https://docs.shipeasy.ai/metrics/grammar).

## Rates — write them as a division

A conversion or error rate is not a function of its own; it is a **division** of two aggregates:
how many did the thing, out of how many could have.

```bash
shipeasy metrics create purchase_conversion \
  --event-name purchase \
  --query 'count(purchase) / count(session_start)'
```

On a chart that is the rate over each bucket. Use it whenever the question is yes/no.

> **Note**

There is no single-event "unique users" aggregation. `count_users(purchase)` used to be one and
was removed: Analytics Engine samples rows under load and weights the survivors, and a distinct
count cannot be reweighted — sampling reweights rows, not sets — so it under-reported by the
sample interval with no way to correct it. A rate has no such problem, because both sides are
sampled the same way. Metrics stored before the removal still chart; new ones are written as
rates.

## Count

How many of the event happened in each bucket?

```bash
shipeasy metrics create sessions \
  --event-name session_start \
  --query 'count(session_start)'
```

Counts are the workhorse: error counts, signups, checkouts. A very spiky count is often better as a
rate (`count(session_start) / count(app_open)`) if the raw number mostly tracks traffic.

## Sum

Add a numeric property across all matching events.

```bash
shipeasy metrics create revenue \
  --event-name purchase \
  --query 'sum(purchase, revenueCents)'
```

Sums are **heavy-tailed**. One $50,000 enterprise purchase can swing a whole day. The metric's
`--winsorize-pct` clamps that — the default is 99 and is rarely wrong.

## Average

The mean of a numeric property across the events in each bucket.

```bash
shipeasy metrics create avg_order_value \
  --event-name purchase \
  --query 'avg(purchase, revenueCents)'
```

The average runs over the events that exist, so a bucket with no events has no average rather than
a zero. For "average among buyers" that is what you want; for "revenue per session" write a
division instead: `sum(purchase, revenueCents) / count(session_start)`.

## Minimum, maximum and standard deviation

`min` and `max` are the extremes of a property; `stddev` is its spread. They are most useful next to
an average — `stddev(req_dur, ms) / avg(req_dur, ms)` is the coefficient of variation, a quick read
on how steady a latency is.

## Percentiles

`p50`, `p75`, `p90`, `p95` and `p99` read a point on the distribution of a numeric property. They are
the right tool for latency and size, where the average hides the tail.

```bash
shipeasy metrics create p95_page_load_ms \
  --event-name page_view \
  --query 'p95(page_view, loadTimeMs)'
```

Quantiles do not merge across groups, so a percentile can't be averaged back together after a
`by (…)` split — the parser refuses that rather than quietly give you a wrong number.

## Outlier handling

`sum` and `avg` need outlier handling. The metric clamps with **winsorising**: anything above the
chosen percentile is set to the value at that percentile.

```bash
shipeasy metrics create revenue \
  --event-name purchase \
  --query 'sum(purchase, revenueCents)' \
  --winsorize-pct 99
```

`99` is the default; `95` and `90` clamp harder. It trims the rarest 1% (or 5% / 10%) and keeps the
body of the distribution intact. Clamping steadies the series — a threshold alert stops flapping on
one big order — at the cost of slightly understating a real move in the tail.

## Filters

You can tighten what counts toward a metric with **filters**, written inline as
`event{label=value}` and applied to the event's `properties` before aggregation:

```bash
shipeasy metrics create organic_purchase \
  --event-name purchase \
  --query 'count(purchase{channel="organic"})'
```

Multiple predicates inside `{}` are ANDed (commas separate them, and `or` groups them). String
values must be double-quoted. `=~` matches a **glob**, not a regex: `*` is any run of characters,
`?` is exactly one, and the pattern matches the whole value.

```bash
# Web only
'count(purchase{platform="web"})'

# Geographic slice — a value set, not a regex
'count(purchase{country in ("US", "CA", "GB")})'

# Everything EXCEPT free tier — one negation, in front of the predicate
'count(purchase{not tier="free"})'
```

Many metrics can share one underlying event, each filtering differently — no need to log the same
purchase twice under different names.

## Direction

The dashboard infers each metric's "good" direction from its name. Words like `error`, `fail`,
`latency`, `crash`, `churn` and `bounce` read as lower-is-better; that decides which way a trend
cell is coloured and which side a directional alert rule watches. Set `direction` explicitly on the
metric when the heuristic gets it wrong.

## When you don't have the event yet

A metric definition can be created before any matching events exist. The pipeline picks them up
once they start arriving, so you can define the metric for an upcoming change ahead of time and
deploy the `track()` call as part of the same release.

The series only ever covers events that were actually logged — creating the metric does not
back-fill a period during which nothing emitted the event.

## Inspecting a metric

```bash
# What does the metric definition look like?
shipeasy metrics show purchase_conversion

# What's the historical baseline?
shipeasy metrics series purchase_conversion --from 2026-06-01 --to 2026-06-30 --bucket day
```

Run `shipeasy metrics series` before you put a rule on a metric — the daily buckets show you the
baseline rate and how much it already wanders, which is what a sane threshold has to sit outside
of.

**Related**

- [Query DSL grammar](https://docs.shipeasy.ai/metrics/grammar) — The formal shape of a query
- [Quickstart](https://docs.shipeasy.ai/metrics/quickstart) — One metric, end to end
- [Configure alerts](https://docs.shipeasy.ai/metrics/alerts) — Put a threshold on the number
- [Flow & dependencies](https://docs.shipeasy.ai/flags/flow) — What feeds the metric, and what it feeds
