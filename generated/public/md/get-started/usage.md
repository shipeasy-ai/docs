# Usage & quotas

Source: https://docs.shipeasy.ai/get-started/usage

> See per-evaluation usage across feature flags, configs, killswitches, and events — and how it tracks against your plan's included credit.

The **Usage** page (`/dashboard/<projectId>/usage`) shows how much your project reads from Shipeasy: per-evaluation activity over the last **30 days**, counted at the edge from SDK telemetry beacons.

> **Counts are sampled and daily**

Usage is approximate (sampled) and refreshes **once daily**. It's an activity view, not a billing
meter — nothing on this page rejects or drops traffic.

## What's counted

Reads are bucketed into five features, each with its own headline tile and daily sparkline, plus a **Total reads** tile:

| Feature           | Counts                  |
| ----------------- | ----------------------- |
| **Feature flags** | Gate evaluations.       |
| **Configs**       | Config reads.           |
| **Killswitches**  | Killswitch checks.      |
| **Events**        | Logged events ingested. |

Below the tiles, **Busiest resources** lists your highest-volume individual flags/configs/events with a per-resource sparkline and total, so you can see which specific resource is driving the numbers.

## Included credit & quotas

Paid plans include a monthly allowance of events and evaluations. Cross **80%** of it and a banner appears on this page showing usage against the allowance; at 100% the banner turns red.

> **Nothing is dropped**

Exceeding the included credit is **informational only** — evaluations and events keep flowing. The
banner is a heads-up to consider upgrading if the volume is your new normal.

Some resources (flags, configs, kill switches, metrics, alert rules, SDK keys) are hard caps rather than usage meters — exceeding one is rejected with `PLAN_LIMIT` rather than billed.

> **Where the numbers live**

Docs carry no allowances, caps or prices — they move faster than a docs push. **Settings →
Billing** shows your live limits and where you stand against each one; the [pricing
page](https://shipeasy.ai/pricing) has the full matrix

**Related**

- [Pricing](https://shipeasy.ai/pricing) — The caps and allowances behind every plan.
- [Project settings & modules](https://docs.shipeasy.ai/get-started/modules) — Billing, plan switching, and included credit.
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — How reads happen on the hot path.
