# Plan entitlements with a dynamic config

Source: https://docs.shipeasy.ai/flags/case-studies/entitlements-with-configs

> Gate features by plan tier from one typed config instead of a sprawl of per-feature flags.

You have plans — Free, Team, Enterprise — and each unlocks a different set of features and limits: seat count, API rate, advanced exports, SSO. The naive approach is one feature flag per capability, targeted by plan. Twenty features later you have twenty flags, twenty targeting rules that all say the same `account.plan IN [...]`, and no single place to see "what does Team get?"

Model the entitlement table as **one typed [config](https://docs.shipeasy.ai/flags/configs)**, keyed by plan.

**Why a config and not flags?** Entitlements are _data_, not a boolean rollout. You're not ramping anything — you're looking up a structured value for the user's tier. A config gives you a typed object, edited in one place, with no redeploy when sales invents a new bundle.

## 1. Define the entitlements config

One config holds the whole matrix:

```ts
type Entitlements = {
  seats: number;
  apiRatePerMin: number;
  advancedExports: boolean;
  sso: boolean;
};
```

In the dashboard, create a config `entitlements` whose typed value is targeted by `account.plan`, returning a different object per tier — with the Free tier as the default.

## 2. Read it once, branch everywhere

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY!,
  attributes: (account: Account) => ({
    account_id: account.id,
    plan: account.plan,
  }),
});

function entitlementsFor(account: Account): Entitlements {
  const flags = new Client(account);
  return (
    flags.getConfig<Entitlements>("entitlements") ?? {
      seats: 1,
      apiRatePerMin: 60,
      advancedExports: false,
      sso: false,
    }
  );
}
```

Now every gate in your app is a property read, not a flag lookup:

```ts
const ent = entitlementsFor(account);

if (!ent.advancedExports) return upsell("advanced-exports");
if (seatsInUse >= ent.seats) return upsell("more-seats");
rateLimiter.configure(ent.apiRatePerMin);
```

> **One source of truth**

The entire entitlement matrix lives in one config you can read top to bottom. "What does Team
get?" is answered by looking at one value, not by grepping for twenty flags.

## 3. Always default, always typed

Provide a fallback object on every `getConfig` call. If the config is missing or the SDK bundle hasn't loaded yet, you serve the safe Free-tier entitlements rather than crashing or silently granting Enterprise.

- `seats` (number) — Max active seats for the tier.
- `apiRatePerMin` (number) — Per-minute API budget.
- `advancedExports` (boolean) — Unlocks the exports surface.
- `sso` (boolean) — Enterprise SSO entitlement.

## Rollout & measurement plan

- **Migrate incrementally:** introduce the config, point one feature at it, verify parity, then retire that feature's old flag. Repeat. You never have a big-bang switchover.
- **New plan, no deploy:** when sales bundles a new "Team Plus" tier, add a branch to the config's targeting and ship — no code change.
- **Limits as data:** put numeric limits (seats, rate) in the same config so changing a quota is a dashboard edit, audited like any other config change.
- **Guardrail:** add an [alert](https://docs.shipeasy.ai/metrics/alerts) on upsell-impression volume — a sudden spike usually means a config edit accidentally downgraded a tier.

**Related**

- [Dynamic configs](https://docs.shipeasy.ai/flags/configs) — Typed values with targeting
- [Killswitches](https://docs.shipeasy.ai/flags/killswitches) — When you want a switch, not data
- [Roll out to companies](https://docs.shipeasy.ai/flags/case-studies/company-rollout-bucketby) — B2B targeting by account
