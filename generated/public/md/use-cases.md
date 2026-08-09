# Advanced use cases

Source: https://docs.shipeasy.ai/use-cases

> Four cross-cutting patterns that combine flags, configs, killswitches, metrics, alerts and feedback into one workflow — the things you can only do when it's all one platform.

Every primitive on its own is documented in its own section. This page is about the
_seams_ — the workflows that only exist because flags, configs, killswitches,
metrics, alerts and feedback share one SDK, one API and one project.
Each pattern below states the problem, the approach, and which primitives it wires
together. Follow the links for the step-by-step version.

- **[Per-tenant rollout, automated](#roll-a-feature-out-to-new-tenants-automatically)** — One killswitch, a switch inserted per tenant by your provisioning code.

- **[Plan entitlements, no redeploy](#change-plan-entitlements-without-a-redeploy)** — A dynamic config as the live entitlements map, targeted by plan.

- **[A rollout that halts itself](#ramp-a-feature-that-pages-you-when-the-number-moves)** — Ramp behind a metric that pages — and break-glass with a killswitch.

- **[Exception to opened PR](#turn-a-spiking-exception-into-an-opened-pr)** — A spiking error files its own ticket and an AI trigger fixes it.

## Roll a feature out to new tenants automatically

**Problem.** You're rolling a feature out tenant by tenant, but your tenant list is
never static — new accounts sign up every day, and you don't want to redeploy or
hand-edit a targeting rule each time one does.

**Approach.** Create **one** killswitch for the feature. A killswitch carries a map
of named [**switches**](https://docs.shipeasy.ai/flags/killswitches) — per-key boolean overrides
layered on top of the global state. Have your provisioning code call the Admin API to
insert a `tenant:<id>` switch the moment a tenant is created, then flip that one
switch to grant or revoke access — no code change, no deploy, one lever per tenant.

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({ apiKey: process.env.SHIPEASY_SERVER_KEY! });

export async function handler(tenantId: string) {
  const flags = new Client({ user_id: tenantId });
  // resolves the tenant's named switch, falling back to the global state
  if (flags.getKillswitch("new-checkout", `tenant:${tenantId}`)) {
    return newCheckout(tenantId);
  }
  return legacyCheckout(tenantId);
}
```

```bash
# your onboarding job runs this as each tenant is provisioned
shipeasy release killswitch set new-checkout --switch-key tenant:acme --value true --env prod
```

**Combines:** killswitch switches + the Admin API driven from your own provisioning code.

**Related**

- [Killswitches](https://docs.shipeasy.ai/flags/killswitches) — The switches map in full
- [Per-tenant killswitch](https://docs.shipeasy.ai/flags/case-studies/per-tenant-killswitch) — Worked example with the CLI

## Change plan entitlements without a redeploy

**Problem.** A customer upgrades, downgrades, or negotiates a custom limit, and you
want the new entitlements — seat count, API quota, which features are unlocked — to
take effect immediately, without shipping code or running a migration.

**Approach.** Model entitlements as a typed [**dynamic config**](https://docs.shipeasy.ai/flags/configs)
rather than a flag. Store the limits and feature set as the config's value, and
target it by a `plan` (or `tenant`) attribute. Your code reads one `getConfig()`; a
plan change is a config edit — or just a change to the customer's attribute — applied
through the dashboard, CLI or Admin API and live on the next poll.

```ts
const flags = new Client({ user_id, attributes: { plan: "business" } });
const limits = flags.getConfig("entitlements"); // { seats: 25, apiRpm: 600, export: true }
```

**Combines:** dynamic configs (typed values + targeting) + [attributes](https://docs.shipeasy.ai/get-started/attributes) + the Admin API for programmatic upgrades.

**Related**

- [Dynamic configs](https://docs.shipeasy.ai/flags/configs) — Typed remote values
- [Entitlements with configs](https://docs.shipeasy.ai/flags/case-studies/entitlements-with-configs) — Full pattern

## Ramp a feature that pages you when the number moves

**Problem.** You want to ramp a risky change from 1% to 100%, but not babysit a
dashboard the whole time. If it drives error rate or latency the wrong way, it should
stop — or at least page someone — before it reaches everyone.

**Approach.** Put the feature behind a [gate](https://docs.shipeasy.ai/flags/gates) and ramp its
rollout percentage. Define the thing you're afraid of breaking as a
[**metric**](https://docs.shipeasy.ai/metrics/quickstart), and attach a
[**threshold alert**](https://docs.shipeasy.ai/metrics/alerts) to it — "checkout errors > 50 in the last
hour". The alert is evaluated server-side by cron and files a ticket into your
feedback queue the instant it breaches, while you keep the same feature's
[killswitch](https://docs.shipeasy.ai/flags/killswitches) armed as the break-glass to cut it to
zero without redeploying.

**Combines:** gate rollout + a metric + a threshold alert (auto-files a ticket) + a killswitch for break-glass.

> **Alerts need no SDK call**

Alert rules are evaluated by a cron on the edge — you only define the rule and the metric. Nothing
to poll, nothing to wire into the hot path.

**Related**

- [Define the metric](https://docs.shipeasy.ai/metrics/quickstart) — The number the rule watches
- [Alerts](https://docs.shipeasy.ai/metrics/alerts) — Threshold rules that file tickets
- [Rollouts](https://docs.shipeasy.ai/flags/gates/rollouts) — Gradual ramp

## Turn a spiking exception into an opened PR

**Problem.** A handled error that used to fire twice a day starts firing twice a
minute after a deploy. You want it noticed, triaged and — where possible — fixed,
without a human watching log volume.

**Approach.** Report the error through [`see()`](https://docs.shipeasy.ai/feedback/error-reporting) instead of
a bare `console.error`, so it becomes a **tracked error** with a frequency the backend
counts. Point a [threshold alert](https://docs.shipeasy.ai/metrics/alerts) at that error's rate; when it
crosses the line the alert files a bug into the same ops queue as everything else.
From there an [**AI trigger**](https://docs.shipeasy.ai/get-started/triggers) — Claude, Copilot, Cursor or
Jules — picks the ticket up and opens a pull request against it. The loop from caught
exception to proposed fix runs without anyone paging themselves.

**Combines:** `see()` error reporting → tracked-error frequency → a threshold alert (files the ticket) → the ops queue → an AI trigger that opens the PR.

**Related**

- [Error reporting](https://docs.shipeasy.ai/feedback/error-reporting) — Report handled errors with see()
- [AI triggers](https://docs.shipeasy.ai/get-started/triggers) — Hand a ticket to an agent
- [Alerts](https://docs.shipeasy.ai/metrics/alerts) — Fire when the rate crosses a threshold

## Where to go next

These patterns are deliberately composed from primitives you can read about
individually. If one is close to what you need, start from its section links above;
if you want the smaller, single-primitive recipes, the
[Flags & Configs case studies](https://docs.shipeasy.ai/flags/case-studies) are the next
level down.
