# Aggregation types

Source: https://docs.shipeasy.ai/metrics/aggregations

> Conversion, count, sum, mean, ratio — pick the right aggregation, set outlier handling, and avoid the variance traps that bite means and sums.

A **metric** is "events aggregated per user." The aggregation function turns each user's event
stream into a single number the platform charts over time and alert rules compare. Pick
the right one and your power calculations are honest; pick the wrong one and a single outlier can
swing your result.

## The five types

| Type         | Per-user value                                | Best for                         | Variance behaviour                     |
| ------------ | --------------------------------------------- | -------------------------------- | -------------------------------------- |
| `conversion` | `1` if event happened at least once, else `0` | Did they buy? Did they retain?   | Bounded `p(1-p)` — friendliest.        |
| `count`      | Number of events                              | Page views, sessions, clicks     | Long-tailed; outliers possible.        |
| `sum`        | Sum of a numeric property                     | Revenue, time spent, items added | Heavy-tailed; outliers a real problem. |
| `mean`       | Average of a numeric property                 | Order value, session length      | Same as sum, plus zero-handling.       |
| `ratio`      | Numerator-event / denominator-event           | CTR, conversion per visit        | Delta-method variance — special.       |

## Conversion

The simplest and statistically the friendliest. Per user: did the event happen at least once
during the analysis window?

```bash
shipeasy metrics create purchase_conversion \
  --event-name purchase \
  --query 'count_users(purchase)'
```

Each user contributes a `0` or `1`. The metric mean is the fraction who converted. Variance is
bounded by `p(1-p)`, which caps at `0.25`. Power calculations are cheap; the t-test behaves; you
can't have an outlier.

Use this whenever the question is yes/no.

## Count

Per user: how many of the event happened?

```bash
shipeasy metrics create sessions_per_user \
  --event-name session_start \
  --query 'count(session_start)'
```

Each user contributes an integer ≥ 0. Means and variances behave
reasonably for low-volume events (0–5 per user) and get long-tailed for
high-volume ones (a power user with 200 sessions skews the mean). For
long-tailed counts, consider:

- Tightening the **winsorize** percentile (`--winsorize 95` instead of the 99 default) to clamp the heavy tail.
- Switching to `count_users(session_start)` (did they have at least 1 session?) if the count distinction doesn't drive your decision.

## Sum

Per user: sum a numeric property across all matching events.

```bash
shipeasy metrics create revenue_per_user \
  --event-name purchase \
  --query 'sum(purchase, revenueCents)'
```

The classic "did this change make us more money per user." Each
user contributes their total revenue. Non-purchasers contribute `0`.

Sums are **heavy-tailed**. One $50,000 enterprise purchase can swing
the mean for thousands of users. The metric's `--winsorize` percentile
clamps that — the CLI default is `--winsorize 99` and is rarely wrong.

## Mean

Per user: average a numeric property across their events.

```bash
shipeasy metrics create avg_order_value \
  --event-name purchase \
  --query 'avg(purchase, revenueCents)'
```

There's a trap with `avg`: should users with zero matching events count
as `0`, or be dropped from the denominator entirely? Today the DSL's
`avg` averages across all exposed users — non-purchasers contribute `0`
("average revenue per _exposed user_"). To answer the "average across
buyers only" question instead, define two metrics and divide via the
`ratio` aggregation, or compute the per-buyer average offline.

## Ratio

Per user: numerator-event count divided by denominator-event count.
Express it with `ratio(...)` between two count arms — `count` or
`count_users` are the only arm aggregations supported.

```bash
shipeasy metrics create click_through_rate \
  --event-name click \
  --query 'ratio(count(click), count(impression))'
```

Use ratios for inherently-ratio questions: clicks per impression, conversions per visit, errors
per request. **Don't** compute the ratio yourself and store it as a `mean` — the math is
different.

Why it matters: the naive ratio-of-means (mean of numerators divided by mean of denominators)
under-states the variance. Shipeasy uses the **delta method** to compute it correctly — which is
what makes the confidence band the dashboard draws, and any anomaly rule armed on the series,
trustworthy rather than jumpy. If you had computed `clicks/impressions` yourself per user, then
taken the mean, you'd be calculating the wrong thing.

The dashboard shows numerator and denominator alongside the ratio so the math is auditable.

## Outlier handling

Sums and means need outlier handling. Two options:

**Winsorize** at a percentile. Anything above is clamped to the value
at that percentile.

```bash
shipeasy metrics create revenue_per_user \
  --event-name purchase \
  --query 'sum(purchase, revenueCents)' \
  --winsorize 99
```

`99` (default), `95`, `90`. Lower percentiles clamp more aggressively.
Trims the rarest 1% (or 5% / 10%) to the value of that percentile,
keeps the body of the distribution intact.

For a hard ceiling (e.g. session length can't reasonably exceed 4
hours,
revenue per user can't exceed your enterprise plan price.

> **Symmetric across arms**

The cutoff is computed from the **combined** control + treatment sample, then applied to both
arms. This prevents the bug where one variant accidentally has its outliers preserved and looks
artificially better. You can verify in the dashboard: the "applied threshold" row shows the same
value across arms.

The trade-off: clamping reduces variance (good — narrower CI, easier to detect lift) at the cost
of slightly understating the true effect when the variant genuinely moves the tail (rare).

## Filters

You can tighten what counts toward a metric with **filters**. Same shape as feature flag targeting rules,
applied to the event's `properties` payload before aggregation:

```bash
shipeasy metrics create organic_purchase \
  --event-name purchase \
  --query 'count_users(purchase{channel="organic"})'
```

Now only `purchase` events with `channel == "organic"` count. Multiple
predicates inside `{}` are ANDed (commas separate them). String values must
be double-quoted in the DSL; `=~` does regex match for numeric / pattern
filters.

Common shapes:

```bash
# Web only (exclude mobile app purchases)
'count_users(purchase{platform="web"})'

# Geographic slice
'count_users(purchase{country=~"^(US|CA|GB)$"})'

# Multiple — ANDed inside the same {}
'count_users(purchase{platform="web", country="US"})'
```

Filters run cheaply during aggregation. You can have many metrics that
share the same underlying event, each filtering differently — no need
to log the same purchase twice with different names.

## Direction

The dashboard infers each metric's "good" direction from its name and its
aggregation type. Words like `error`, `fail`, `latency`, `crash`, `churn`,
`bounce` are read as lower-is-better; that decides which way a trend cell is
coloured and which side a directional alert rule watches. Set `direction`
explicitly on the metric when the heuristic gets it wrong.

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
