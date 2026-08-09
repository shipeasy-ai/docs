# Credits & metering

Source: https://docs.shipeasy.ai/assistant/credits

> The assistant runs on prepaid credits — how they're deducted, how to top up, and what happens at zero.

The assistant is metered with **prepaid credits**, separately from your subscription. Each plan includes an allowance; you top up when you want more headroom. Credits keep heavy AI usage predictable instead of metered after the fact.

> **No numbers here**

What each plan includes, and what a top-up pack costs, is on the [pricing
page](https://shipeasy.ai/pricing) and on **Settings → Billing** — never in these docs, so there
is nothing here to go stale

## How credits are deducted

A credit is consumed per assistant interaction that calls the model. Read-only browsing of your own resources is cheap; longer reasoning, doc search, and multi-step plans cost more. The running balance is shown in the assistant panel and on the billing tab.

- `Included allowance` (per plan) — Each plan ships with a monthly credit allowance. The amount is on the pricing page and the billing tab.
- `Top-ups` (prepaid) — Buy more credits from the billing tab; they're added to your balance immediately.
- `Balance` (live) — Shown in the assistant panel and the billing tab. Deducted as you go.

## Topping up

Credit top-ups are part of the main **billing tab** — there's no separate flow. Purchases go through the same Stripe checkout as your subscription and land on your balance right away.

> **One billing surface**

Assistant credits were merged into billing — manage your subscription and your assistant credits
in the same place. Top-ups are a one-time charge, not a plan change.

## At zero balance

When the balance hits zero, the assistant pauses write and reasoning actions and prompts you to top up. Your flags, configs, and data are unaffected — only the in-dashboard assistant is gated on credits.

**Related**

- [Assistant](https://docs.shipeasy.ai/assistant) — What credits power
- [Read vs write mode](https://docs.shipeasy.ai/assistant/read-vs-write)
- [Pricing](https://shipeasy.ai/pricing) — What each plan includes
