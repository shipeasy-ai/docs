# Metrics

Source: https://docs.shipeasy.ai/metrics

> Define what you measure — aggregations, filters, outlier handling, and ratio metrics over your own events.

A **metric** is a number computed from a set of events you log. It is the thing you watch while a flag ramps, and the thing an [alert rule](https://docs.shipeasy.ai/metrics/alerts) compares against a threshold. Get the definition right and the rest of the observability story follows.

## Aggregation functions

A metric query reads one event and reduces it with an **aggregation function**. Shipeasy has eleven, and the **New metric** form's _Aggregate_ dropdown offers exactly these:

| In the dropdown | In the DSL | What it computes                         | Needs a value property |
| --------------- | ---------- | ---------------------------------------- | ---------------------- |
| count           | `count`    | Number of events                         | No                     |
| sum             | `sum`      | Sum of a numeric property                | Yes                    |
| average         | `avg`      | Mean of a numeric property               | Yes                    |
| minimum         | `min`      | Smallest value of a numeric property     | Yes                    |
| maximum         | `max`      | Largest value of a numeric property      | Yes                    |
| std dev         | `stddev`   | Standard deviation of a numeric property | Yes                    |
| p50             | `p50`      | Median of a numeric property             | Yes                    |
| p75             | `p75`      | 75th percentile                          | Yes                    |
| p90             | `p90`      | 90th percentile                          | Yes                    |
| p95             | `p95`      | 95th percentile                          | Yes                    |
| p99             | `p99`      | 99th percentile                          | Yes                    |

The dashboard says **average**; the query language spells it `avg`. Any other percentile is written `p(97.5, event, property)`, and `p999` is accepted as shorthand for the 99.9th. A _rate_ — conversion, error rate — is not a twelfth function: it is a division of two counts, `count(purchase) / count(session_start)`. Arithmetic, grouping and time functions on top of these are in the [grammar](https://docs.shipeasy.ai/metrics/grammar); [Aggregation functions](https://docs.shipeasy.ai/metrics/aggregations) says when to reach for which.

### When there is no matching event

For a rate, a bucket with no matching numerator event contributes `0`. For `avg`, the average runs over the events that exist, so a bucket with no events has no average rather than a zero. To answer "average among buyers only" explicitly, write it as a division (`sum(purchase, revenueCents) / count(purchase)`).

## Creating a metric

Metrics are defined by a small **query DSL** — the same one the dashboard
generates when you pick aggregation, source event, and filters in the
"New metric" form. Run `shipeasy metrics grammar` for the full spec; the
most common shapes:

```bash
# conversion on `purchase` — a rate
shipeasy metrics create purchase_conversion \
  --event-name purchase --query 'count(purchase) / count(session_start)'

# revenue
shipeasy metrics create revenue \
  --event-name purchase --query 'sum(purchase, value)'

# average order value
shipeasy metrics create avg_order_value \
  --event-name purchase --query 'avg(purchase, value)'

# sessions
shipeasy metrics create sessions \
  --event-name session_start --query 'count(session_start)'
```

Or in the dashboard: open **Metrics** and click **New metric**.

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

For `sum` and `avg`, a single $50,000 enterprise purchase can swing the number for a whole day. Shipeasy supports two outlier handlers per metric:

- **Winsorise** at a configurable percentile (1–99, default 99). Anything above is clamped to the value at that percentile. Default for `sum` and `avg`.
- **Cap** at an absolute value. Use this when there's a domain-specific ceiling (e.g. a maximum plausible session length).

```bash
# Winsorise at p99 (the default; --winsorize-pct 99 is implicit)
shipeasy metrics create revenue \
  --event-name purchase --query 'sum(purchase, value)' \
  --winsorize-pct 99

# Clamp at p95 instead
shipeasy metrics create revenue \
  --event-name purchase --query 'sum(purchase, value)' \
  --winsorize-pct 95
```

Winsorising is the default and is rarely wrong. The trade-off: clamping reduces variance (good — a
steadier series, so a threshold alert stops flapping on one big order) at the cost of slightly
understating a real move in the tail (rare).

## Ratio metrics

Some questions are inherently ratios — _"clicks per impression"_,
_"conversion per visit"_. Write them as a division of two aggregates:

```bash
shipeasy metrics create click_through_rate \
  --event-name click \
  --query 'count(click) / count(impression)'
```

Any two expressions divide, so a ratio can mix `count`, `sum` and the rest —
`sum(order, amount) / count(session)` draws fine. The dashboard shows the numerator and
denominator alongside the ratio so the math is auditable.

## API · `metrics.create`

- `name` (string) — Stable key, single segment or folder.name. Lowercase letters, digits, _ and -. Immutable after create.
- `event_name` (string) — Source event the query reads from.
- `query` (string) — The metric DSL, e.g. `sum(purchase, amount)`. Every aggregation function in the table above, plus arithmetic and grouping, is available — see the  grammar.
- `display_name` (string) — What a human calls the metric. Free text and editable; the name stays the key.
- `folder` (string) — Optional folder grouping metrics in the dashboard.
- `winsorize_pct` (integer (1–99)) — Clamp outliers to this percentile for sum and avg. Defaults to 99.
- `direction` — Which way is good. Colours trend cells and picks a side for a directional alert rule.
- `unit` (string) — Display unit, for example ms, % or $.

## Where to next

- **[The metric DSL](https://docs.shipeasy.ai/metrics/grammar)** — Every aggregation, filter and operator the query accepts, and the ones it rejects by name.

- **[Threshold alerts](https://docs.shipeasy.ai/metrics/alerts)** — Watch a metric and raise a ticket when it crosses the line.

- **[User attributes](https://docs.shipeasy.ai/get-started/attributes)** — Pass enough about the user that segmentation is rich.
