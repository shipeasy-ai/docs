# Feature flags

Source: https://docs.shipeasy.ai/flags/gates

> Boolean feature flags with targeting rules, percentage rollouts, kill-switches and per-user overrides — evaluated locally, at zero per-request cost.

A **feature flag** is a single boolean answer for a single user. It is the unit of <em>"should I do the new thing?"</em> in your code. Feature flags are evaluated locally — the SDK keeps the bundle in process and the call is a hash table lookup, not a network round trip.

Use a feature flag when the answer is yes/no. For typed payloads (strings, numbers, JSON), reach for a [dynamic value](https://docs.shipeasy.ai/flags/configs/values). To know whether the change worked, define a [metric](https://docs.shipeasy.ai/metrics/quickstart) and watch it across the ramp.

## Anatomy of a feature flag

- **[enabled — master switch](#enabled)** — The on/off bit. When false, the feature flag returns <code>false</code> for everyone, ignoring rules. Targeting rules and rollout are preserved.

- **[killswitch — emergency off](#killswitch)** — Same effect as <code>enabled = false</code> but separate, so you can disable a feature during an incident without losing its targeting config.

- **[rules — targeting](#rules)** — Optional list of <code>{ attr, op, value }</code> predicates. ANDed. A user must match every rule (and the rollout) to get <code>true</code>.

- **[rolloutPct — percentage](#rollout)** — <code>0..10000</code> internally (UIs show 0–100%). Bucketing is deterministic by user ID and salt.

- **[overrides — per-user](#overrides)** — Force <code>true</code> or <code>false</code> for specific user IDs. Bypasses everything. Useful for QA + dogfooding.

- **[salt — hash salt](#salt)** — Per-flag salt fed into the bucketing hash. Bump it and rollout buckets re-shuffle — useful when rolling out the same feature twice.

## Evaluation order

For a request `gate(name, user)`:

```
1. killswitch ON                       → false
2. enabled OFF                         → false
3. user.user_id ∈ overrides[true]      → true
4. user.user_id ∈ overrides[false]     → false
5. any rule fails                      → false
6. murmur3(salt + user_id) % 10000 < rolloutPct → true
7. otherwise                           → false
```

That order matters: rules are evaluated **before** the rollout. <em>"100% of `plan = pro`"</em> means <em>100%</em> of pro users, not <em>the same 100% bucket</em> filtered down to pros. The rollout filter never fights a targeting rule.

> **Why deterministic bucketing matters**

Same user, same feature flag, same answer — every time, on every server, in every language SDK. No
flicker, no "why does this user see different things on different requests", no need to
persist assignments anywhere. The hash is the persistence.

## API

### Server SDK

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan, country: u.country }),
});

const flags = new Client(currentUser);
const enabled = flags.getFlag("new-checkout-flow");
```

### Browser SDK

```ts
import { configure, Client } from "@shipeasy/sdk/client";

configure({
  clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan, country: u.country }),
});

const flags = new Client(currentUser);
await flags.ready();

if (flags.getFlag("new-checkout-flow")) {
  // …
}
```

`getFlag()` is synchronous. If you call it before the first
poll resolves, you get `false` (or the bootstrap value when SSR has
provided one) — never a thrown error. `configure()` is idempotent; call
it once per cold start.

- `name` (string) — Stable identifier — used in the dashboard, the CLI, and as the KV key suffix. kebab-case.
- `ctx` (EvalContext) — Evaluation context. Must contain `user_id` for deterministic bucketing. Add any attributes used by your targeting rules.
- `defaultValue` (boolean) — Returned when the feature flag is missing from the bundle (e.g. SDK not initialised). Defaults to false — fail closed.
- `bucketBy` (string) — Override the bucketing key for this call. Defaults to `user_id`. Use  `account_id` for B2B cohort consistency.

The return is a plain `boolean`. There is no async, no Promise, no fetch — the bundle is in memory.

## Killswitch [#killswitch]

The killswitch is a separate field from `enabled` so you can keep targeting and rollout intact while turning the feature off. Three places to flip it:

- **Dashboard**: red **Killswitch** chip on the feature flag row.
- **CLI**: `shipeasy release flags disable <name> --killswitch` (without `--killswitch` it toggles `enabled` instead).
- **API**: `PATCH /api/flags/<name>` with `{ "killswitch": true }`.

A killed feature flag returns `false` everywhere within the SDK's next poll. Re-enabling restores the full prior state — overrides, rules, rollout %, salt, all of it. Treat the killswitch as your incident lever; treat `enabled` as your "feature is shipped, deactivated cleanly" lever.

> **Killswitch is a contract, not a panic button**

A killed feature flag goes false within the next poll, not instantly — a worst-case worker still
serves the old path for up to one poll interval after you hit the switch. That interval is
plan-derived; the [pricing page](https://shipeasy.ai/pricing) says what yours is. If your cutoff
has to be tighter than a poll, gate the call site on a value you already hold rather than waiting
on a refresh.

## Overrides [#overrides]

In the dashboard, expand a feature flag and add user IDs under **Overrides → Always on** or **Always off**. Overrides:

- Bypass `enabled`, `killswitch`, all rules, and the rollout.
- Are scoped to **`user_id`** only (no attribute matching — it's a literal set lookup).
- Are great for: QA accounts, internal dogfooders, customer-success demos, repro of a bug a single customer is hitting.

```ts
// dashboard JSON shape:
{
  "name": "new-checkout-flow",
  "overrides": {
    "always_on":  ["u_qa1", "u_qa2", "u_demo"],
    "always_off": ["u_legacy_partner"]
  }
}
```

If you need a percentage-based "always-on for cohort X", use a [targeting rule](https://docs.shipeasy.ai/flags/gates/targeting) on a custom attribute (`internal: true`) instead. Overrides scale linearly per-row in KV; rules are O(1).

## Naming [#enabled]

- **kebab-case**: `new-checkout-flow`, not `newCheckoutFlow`.
- **Describe the change, not the abstract feature**: `enable-redis-pool` ages better than `redis-pool` (which sounds like a permanent feature, not a temporary feature flag).
- **Prefix by area** for grouping: `checkout-`, `nav-`, `infra-`.
- **Avoid double-negatives**: prefer `show-banner` over `hide-banner`.

## Cleaning up [#rules]

Stale flags are technical debt — once a feature is fully launched, delete the flag and the dead code. The CLI helps:

```bash
# Every gate currently at enabled: true, rollout: 100%
shipeasy release flags list \
  | jq '.[] | select(.enabled == 1 and .rolloutPct == 10000) | .name'
```

These are candidates for removal. Grep your source for each name after archiving it, to catch code references that need to be ripped out.

The dashboard also surfaces a **Cleanup** view that lists feature flags which have been at 100% (or 0%) for more than 30 days, with a one-click PR-creation button if you've connected a GitHub app.

## The salt [#salt]

Each feature flag has its own salt. If you ever want to **re-shuffle** the rollout buckets without changing the percentage (say, to avoid the same 5% always being chosen for every feature flag), bump the salt:

```bash
shipeasy release flags update my-feature
```

That's rare. The default salt is fine for almost every case. The salt is also why two feature flags at 50% don't serve the same 50% of users — different salts, different buckets, independently distributed.

## Audit log

Every write to a feature flag is recorded in the audit log: who, when, from what (dashboard, CLI, API), and the diff. Find it under **Configs → Feature flags → \<feature flag\> → History**. Each row links to a one-click revert.

## Limits [#rollout]

Feature flags per project, rules per flag and overrides per flag are all plan-derived. The [pricing page](https://shipeasy.ai/pricing) has the matrix; **Settings → Billing** shows your own caps and how close you are to each. A create over a cap is rejected with `PLAN_LIMIT` rather than silently truncated.

If you hit one, audit for stale flags first — the caps are generous if you delete what you ship.
