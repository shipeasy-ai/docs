# From metric alert to auto-filed ticket

Source: https://docs.shipeasy.ai/feedback/case-studies/alert-to-ticket-loop

> Turn an event into a metric, raise a threshold alert on it, and have the alert file its own ticket for an agent to work.

Something is wrong in production — checkout errors are climbing — and nobody is watching the dashboard at 2am. You want the system to notice on its own, and to land the problem in the same queue your team (or your unattended agent) already burns down, with enough context to act.

That's the full loop: **event → metric → alert → ticket → ops:work.** No human in the first four steps.

## 1. Emit the event

Your app already fires the fact. If it doesn't, add one `track` call at the failure point:

```ts
import { flags } from "@shipeasy/sdk/server";

try {
  await processCheckout(order);
} catch (err) {
  flags.track("checkout_error", { user_id: order.userId, code: err.code });
  throw err;
}
```

## 2. Define the metric

An [alert](https://docs.shipeasy.ai/metrics/alerts) reads a _metric_, not raw events. Create a metric over the event — a count of `checkout_error` per hour:

```bash
shipeasy metrics create checkout-errors \
  --event-name checkout_error --query 'count(checkout_error)'
```

## 3. Raise the threshold alert

The rule watches the metric and fires when it crosses the line over the window:

```bash
shipeasy ops alerts create \
  --name "Checkout errors" \
  --metric-id checkout-errors \
  --comparator gt \
  --threshold 50 \
  --window-hours 1 \
  --severity high
```

> **Windows are whole hours**

Alert windows round to whole hours — a "/30m" request becomes 1h. Size your threshold to the
rounded window, not the one you imagined.

When the cron evaluates the rule and the metric is over 50, it **files a ticket** into the feedback queue automatically — no SDK call, nothing to poll. You only defined the rule.

## 4. Let ops:work pick it up

The auto-filed ticket lands beside your bugs and feature requests, tagged as an alert ticket with the metric, the value, and the threshold it crossed. From there it's just another item in the queue:

**A developer triages it**

The ticket carries the firing metric and value — the on-call has the symptom and the number in
one place.

**Or the agent works it**

The unattended <a href="/feedback">ops:work</a> loop picks it up and implements a fix as an
atomic diff, one item at a time.

## Rollout & measurement plan

- **Tune the threshold before you trust it.** Start the rule disabled-or-loose, watch the metric for a few days, then set the threshold above normal noise so it fires on real regressions, not on Tuesday traffic.
- **One alert, one symptom.** Don't pile conditions into one rule — separate alerts (error rate, latency, signups dropping) each file their own focused ticket.
- **Forward downstream.** Alert tickets are feedback items, so the [Linear/Jira webhook](https://docs.shipeasy.ai/feedback/case-studies/route-bugs-to-linear) forwards them into your tracker just like bugs.
- **Self-monitor too.** This same loop watches Shipeasy's own cron and error metrics — the pattern scales from your app to your infra.

**Related**

- [Alerts](https://docs.shipeasy.ai/metrics/alerts) — The event → metric → alert chain in full
- [Route bugs to Linear](https://docs.shipeasy.ai/feedback/case-studies/route-bugs-to-linear) — Forward the filed ticket downstream
- [Error reporting](https://docs.shipeasy.ai/feedback/error-reporting) — The other source of auto-filed tickets
