# Metrics

Source: https://docs.shipeasy.ai/metrics

> Define what you measure — aggregations, filters, outlier handling, and ratio metrics over your own events.

A **metric** is a number computed from a set of events you log. It is the thing you watch while a flag ramps, and the thing an [alert rule](https://docs.shipeasy.ai/metrics/alerts) compares against a threshold. Get the definition right and the rest of the observability story follows.

## Aggregation types

Shipeasy ships four aggregation functions. Each one collapses a user's event stream into a single number per analysis window:

| Type         | What it computes per user                     | Use it for                        | Variance                               |
| ------------ | --------------------------------------------- | --------------------------------- | -------------------------------------- |
| `conversion` | 1 if the event happened at least once, else 0 | Did they buy? Did they retain?    | Bounded `p(1-p)` — the friendliest.    |
| `count`      | Number of events                              | Sessions, page views, clicks.     | Long-tailed; outliers possible.        |
| `sum`        | Sum of a numeric event property               | Revenue, time spent, items added. | Heavy-tailed; outliers a real problem. |
| `mean`       | Average of a numeric event property           | Order value, session length.      | Same as `sum`, plus zero-handling.     |

Conversion is the simplest and statistically the friendliest — the variance is bounded by `p(1-p)`, so power calculations are cheap and the t-test behaves. Means and sums need more samples and benefit from outlier handling (see below).

### When the metric is "no event"

For a rate, a user with no matching numerator event contributes `0`. For `avg`, the DSL averages across all exposed users — non-purchasers contribute `0` and pull the mean down. To answer "average among buyers only" instead, express it as a division (`sum(purchase, revenueCents) / count(purchase)`) or compute the per-buyer cohort metric offline.

## Creating a metric

Metrics are defined by a small **query DSL** — the same one the dashboard
generates when you pick aggregation, source event, and filters in the
"New metric" form. Run `shipeasy metrics grammar` for the full spec; the
most common shapes:

```bash
# conversion on `purchase` — a rate, per user a 0 or a 1
shipeasy metrics create purchase_conversion \
  --event-name purchase --query 'count(purchase) / count(session_start)'

# revenue per user (includes non-buyers as $0)
shipeasy metrics create revenue_per_user \
  --event-name purchase --query 'sum(purchase, value)'

# average order value (averaged across buyers only)
shipeasy metrics create avg_order_value \
  --event-name purchase --query 'avg(purchase, value)'

# sessions per user
shipeasy metrics create sessions \
  --event-name session_start --query 'count(session_start)'
```

Or in the dashboard: **Metrics → New metric**.

## Filtering events into a metric

You can tighten what counts toward a metric with **filters** — written
inline in the DSL selector as `event{attr=value}`. Filters run against
the event's `properties` payload _before_ the aggregation:

```bash
shipeasy metrics create organic_purchase \
  --event-name purchase \
  --query 'count(purchase{channel="organic"})'
```

Now `organic_purchase` only counts `purchase` events whose `channel` property
equals `"organic"`. Compose multiple predicates inside the same `{}` with commas
— they're ANDed, and `or` groups them. The operators are `=`, `=~` (a **glob**,
not a regex), the order comparisons `>` `>=` `<` `<=` on numeric labels, a value
set with `in (...)`, and `label:*` for "the label is set at all". There is one
negation and it goes in front of a predicate: `not tier="free"`. Common shapes:

```bash
# Web purchases only (exclude mobile app)
'count(purchase{platform="web"})'

# Orders above $10 — numeric label, value written BARE
'sum(purchase{value > 10}, value)'

# Multiple conditions — commas inside {} are ANDed
'count(purchase{platform="web", country="US"})'
```

## Outliers

For `sum` and `mean`, a single $50,000 enterprise purchase can swing the mean for thousands of users. Shipeasy supports two outlier handlers per metric:

- **Winsorise** at a configurable percentile (default `p99`). Anything above is clamped to the p99 value of the combined sample. Default for `sum` and `mean`.
- **Cap** at an absolute value. Use this when there's a domain-specific ceiling (e.g. a maximum plausible session length).

```bash
# Winsorise at p99 (this is the CLI default; --winsorize 99 is implicit)
shipeasy metrics create revenue_per_user \
  --event-name purchase --query 'sum(purchase, value)' \
  --winsorize 99

# Cap at p95 instead
shipeasy metrics create revenue_per_user \
  --event-name purchase --query 'sum(purchase, value)' \
  --winsorize 95
```

Winsorising is the default and is rarely wrong. The trade-off: clamping reduces variance (good — a
steadier series, so a threshold alert stops flapping on one big order) at the cost of slightly
understating a real move in the tail (rare).

## Ratio metrics

Some questions are inherently ratios — _"clicks per impression"_,
_"conversion per visit"_. Express them with the `over` keyword between
two selector arms in the DSL:

```bash
shipeasy metrics create click_through_rate \
  --event-name click \
  --query 'count(click) / count(impression)'
```

As an **experiment** metric both sides must be `count`, because the per-user
collapse asks "did the numerator happen, among the denominator-eligible users".
On a chart any expression divides.

Ratio metrics use the **delta method** to compute variance correctly (the naive ratio-of-means understates variance, which makes an anomaly rule fire on noise). The dashboard shows the numerator and denominator alongside the ratio so the math is auditable.

## API · `metrics.create`

- `name` (string) — Stable identifier. Used in result rows and the CLI.
- `type` — Aggregation function applied per user.
- `event` (string) — Event name to aggregate. For `ratio`, use `numerator_event` +  `denominator_event` instead.
- `property` (string) — Numeric property on the event to aggregate. Required for `sum` and  `mean`.
- `filter` (Rule[]) — Same shape as a feature flag rule. Only events matching all rules are aggregated.
- `winsorise` — Percentile clip for `sum`/`mean`. Default `p99`.
- `cap` (number) — Absolute clip. Mutually exclusive with winsorise.
- `zero_handling` — How to count exposed users with no matching event. Default `include` (treats them as 0).
- `direction` — Which direction is "good". Used to colour trend cells and to pick a side for a directional alert rule. Defaults to `up`.

## Where to next

- **[The metric DSL](https://docs.shipeasy.ai/metrics/grammar)** — Every aggregation, filter and operator the query accepts, and the ones it rejects by name.

- **[Threshold alerts](https://docs.shipeasy.ai/metrics/alerts)** — Watch a metric and raise a ticket when it crosses the line.

- **[User attributes](https://docs.shipeasy.ai/get-started/attributes)** — Pass enough about the user that segmentation is rich.
