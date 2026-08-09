# Configure alerts

Source: https://docs.shipeasy.ai/metrics/alerts

> Turn an event into a metric, then raise a metric-threshold alert that files its own ticket when the metric crosses the line.

An **alert rule** watches one metric and fires when its value crosses a threshold
over a window — "checkout errors `> 50` in the last hour", "active users `< 100`
in the last 24h". When it fires, Shipeasy files a ticket into the same feedback
queue as your bugs and error reports, so the thing you need to look at shows up
where you already triage.

Alerts are evaluated server-side by a cron — there's no SDK call and nothing to
poll. You only define the rule.

## What an alert chart shows

Every rule renders as a 14-day chart of its metric with the alert story drawn on
top. Three things it surfaces — each a different facet of how a rule reads its
metric:

### It shades every breach

The dashed line is the threshold; wherever the metric crosses to the breaching
side, that stretch is shaded in the rule's severity colour and the marker shows
the moment it fired. One band = one alert ticket.

### It compares the window average, not the raw spike

A rule never fires on a single reading — it compares the **window average** (the
bright line) against the threshold. A brief blip that punches over the line
averages back out and never pages; only a sustained move fires. Widen the window
to smooth more, narrow it to catch faster.

### It can guard a floor, not just a ceiling

Flip the comparator to `<` (or `<=`) and the rule watches a **floor** — it fires
when the metric falls _below_ the line. Useful for "signups per hour", "active
sessions", or any health number that's bad when it drops.

## The event → metric → alert chain

An alert rule doesn't read raw events; it reads a **metric**. So a working alert
is a three-link chain:

- **1 · Event** — A fact your app emits — `checkout_error`, `page_view`. Captured through the SDK and stored in Analytics Engine.

- **2 · Metric** — An aggregation over an event — count of events, distinct users, a sum or average. This is the number an alert compares.

- **3 · Alert rule** — A threshold on the metric over a time window, with a severity. The cron evaluates it and fires when the value breaches.

```bash
# 1. a metric over the event (DSL grammar: /shipeasy:metrics:grammar)
shipeasy metrics create checkout-errors \
  --event-name checkout_error --query 'count(checkout_error)'

# 2. a threshold rule on that metric
shipeasy ops alerts create "Checkout errors spiking" \
  --metric checkout-errors --comparator gt --threshold 50 --window 1 --severity danger

# 3. confirm it landed
shipeasy ops alerts list
```

> **Note**

The same three steps are available over MCP (`exp_create_alert_rule`) and as the
`/shipeasy:alerts:create` skill, which surveys your project and proposes rules worth adding. The
CLI command is `shipeasy ops alerts` — `shipeasy ops alerts` is the read-only view of what has
already fired.

## The rule fields

- `name` (string) — Human label (1–120 chars), shown on the rule and on every alert it raises.
- `metric` (metric id or name) — The metric to watch. Immutable once set — to point a rule at a different metric, delete it and create a new one.
- `comparator` — How the value is compared to the threshold: > ≥ < ≤.
- `threshold` (number) — The line the metric value is compared against.
- `window` (integer (hours)) — Lookback window in whole hours, 1–720 (30 days). Defaults to 24.
- `severity` — Severity of the raised alert. Defaults to warn.
- `enabled` (boolean) — Whether the cron evaluates the rule. Defaults to true; pass --disabled to create it dormant.
- `notify` ({ slackChannel?, email? }) — Where this rule's alert is delivered, overriding the project default — a Slack channel (requires a connected Slack connector) and/or an email address. Omit to inherit the project default.

> **Note**

**Windows are whole hours.** The minimum is 1 hour and there are no sub-hour windows — a "last 30
minutes" intent rounds up to 1h. Pick a window long enough that the metric is stable but short
enough to catch the spike you care about.

## How it fires

A cron evaluates every enabled rule on a roughly **10-minute** cadence. For each
rule it:

1. Compiles the rule's metric into a query over the window
   `[now − window hours, now]` and reads the aggregated value from Analytics
   Engine.
2. Compares that value to the threshold with the comparator. If it breaches, the
   rule **raises an alert**.
3. When a previously-breaching rule comes back inside its threshold, the alert
   **auto-resolves** — no manual clearing.

Each rule is evaluated in isolation, so a misconfigured metric can't block the
others.

## What firing produces

A fired alert does three things at once:

- **An alert record** — Shows in the read-only alerts view (`shipeasy ops alerts list`, danger first), with the observed value, the rule, and a deep link to the metric. One active alert per rule — re-breaches update it rather than piling up.

- **A feedback ticket** — Auto-filed into the unified queue as type <strong>alert</strong>. Severity maps to priority: <code>danger → critical</code>, <code>warn → high</code>,<code>info → medium</code>. Deduped while open, so a flapping metric won't spam new tickets.

- **A notification** — An <code>alert.triggered</code> event hits the in-app feed and email, per your project's notification preferences.

When the metric recovers, the alert resolves and no new ticket is filed. If it
breaches again after resolving, a fresh alert and ticket are raised.

## Where alerts are delivered

By default a notification follows your **project default delivery** (set on
Settings → Notifications): a default Slack channel and a default email. With no
default set, email falls back to the project owner and Slack to the connector's
configured channel. Any rule can override that with its own **target** —
useful for routing, say, billing alerts to `#finance` and on-call alerts to
`#incidents`.

The Slack channel is always **picked from your project's real channels** (a
typeahead in the wizard, the in-dashboard assistant, the CLI `channels`
command) — Shipeasy never guesses a channel. A Slack target requires a
connected Slack connector; the email target works with no connector.

```bash
# list the channels the bot can post to
shipeasy ops alerts channels

# create a rule that posts to #incidents and emails on-call
shipeasy ops alerts create "Checkout errors spiking" \
  --metric checkout-errors --comparator gt --threshold 50 \
  --slack-channel '#incidents' --email oncall@acme.com

# move an existing rule's target, or clear it back to the project default
shipeasy ops alerts update "Checkout errors spiking" --slack-channel '#billing'
shipeasy ops alerts update "Checkout errors spiking" --clear-target
```

Over MCP the same control is the `notify` argument on `exp_create_alert_rule` /
`exp_update_alert_rule` (`{ slack_channel: { id, name }, email }`), and the
in-dashboard assistant renders the **same** channel typeahead before it writes
the rule.

> **Note**

**From Slack:** the `/shipeasy alert <metric> <gt|gte|lt|lte> <threshold> [name]`
slash command creates a rule from a channel and automatically targets **that
channel** — the alert posts back to where you set it up. Requires the Slack app
to be connected to the project.

Which channels fire (in-app, email, Slack) is still governed by your per-event
notification preferences — the target only decides _where_ each enabled channel
delivers.

## Tuning a rule

Everything except the metric is editable in place — adjust the threshold, flip the
comparator, widen the window, change severity, or toggle it off without recreating
it:

```bash
shipeasy ops alerts update "Checkout errors spiking" \
  --threshold 80 --window 2 --severity warn
shipeasy ops alerts update "Checkout errors spiking" --enabled false
```

To repoint a rule at a different metric, delete it and create a new one — the
metric is pinned for the rule's life because it fixes both _what_ is measured and
_how_ it's aggregated.

## Level shifts — when it started, and what changed then

Alerting answers "is something wrong now". The first question of any incident is
a different one — **when did this start, and what did we change at that moment** —
and no alert rule can answer it: the earliest moment a rule can name is the start
of whatever window it happens to watch.

So a nightly scan segments the last two weeks of every metric that carries an
enabled rule, finds the points where its **level** moved and stayed moved, and
records each one with the level either side of it. They show on the metric's
detail panel, newest first, under **Level shifts**.

Beside each one, where there is a match, sits the nearest change you made in the
half hour before it: a gate rolled out, a config edited, a kill switch armed.
That is a **correlation, not a cause** — the flag that went
to 50% four minutes earlier is usually the reason and sometimes a coincidence,
and the panel says "around" rather than "because" for exactly that reason. A
change made _after_ the level moved is never named: that is usually somebody
responding to the incident.

> **Note**

Nothing here pages anybody, and a level shift never files a ticket. It is context for an incident
you already know about, so a metric that moved for a good reason — a launch, a pricing change —
costs you nothing but a line

A spike is not a level shift. One bad bucket, or an excursion that comes straight
back, is what an `anomaly` rule is for; a shift has to hold for at least four
buckets to be recorded at all.

## Where to next

- **[Error reporting with see()](https://docs.shipeasy.ai/feedback/error-reporting)** — Errors auto-file their own tickets once they cross a count threshold.

- **[Define a metric](https://docs.shipeasy.ai/metrics)** — The metric DSL an alert rule reads from.

- **[API reference](https://docs.shipeasy.ai/feedback/api)** — The `alert-rules` and `alerts` admin endpoints.

**Related**

- [Quickstart](https://docs.shipeasy.ai/metrics/quickstart) — Getting to a metric worth alerting on
- [Alert to auto-filed ticket](https://docs.shipeasy.ai/feedback/case-studies/alert-to-ticket-loop) — The loop, worked end to end
- [Scheduled triggers](https://docs.shipeasy.ai/get-started/triggers) — Hand the ticket to an agent
- [Killswitch patterns](https://docs.shipeasy.ai/flags/killswitches/patterns) — What to flip when it fires
