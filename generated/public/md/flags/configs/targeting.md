# Targeting & rollouts

Source: https://docs.shipeasy.ai/flags/configs/targeting

> Show a value to the right users — attribute rules, deterministic percentage rollouts, and per-feature-flag salts. The rules engine, in detail.

A targeting rule on a feature flag is a predicate of the form **`attr op value`**. Multiple rules on a feature flag are **ANDed** together. To OR, use the `in` operator with an array, or split into separate feature flags and combine in code.

This page is the operational reference for the rules engine: every operator, the bucketing math, and the patterns we've seen work for safe rollouts.

## Operators

| Operator                     | Works on                   | Example                           |
| ---------------------------- | -------------------------- | --------------------------------- |
| `eq` / `neq`                 | any                        | `plan eq "pro"`                   |
| `in` / `not_in`              | scalar vs array            | `country in ["US","CA","MX"]`     |
| `gt` / `gte` / `lt` / `lte`  | numbers                    | `tenure_days gt 30`               |
| `contains`                   | string⊂string, array∋value | `roles contains "admin"`          |
| `starts_with` / `ends_with`  | strings only               | `email ends_with "@acme.com"`     |
| `regex`                      | strings only               | `email regex "@acme\\.com$"`      |
| `version_gte` / `version_lt` | semver strings             | `app_version version_gte "2.4.0"` |

Numeric ops coerce strings that look like numbers — `"100" gt 50` is `true`. They never coerce booleans. `regex` is anchored only when you anchor it (`^` / `$`); we run it in the SDK, no server round-trip.

## Common rule shapes

```ts
// Beta cohort — explicit list
{ attr: "user_id", op: "in", value: ["u_1", "u_2", "u_3"] }

// Internal users only
{ attr: "email", op: "regex", value: "@acme\\.com$" }

// Pro plan in supported regions
[
  { attr: "plan",    op: "eq", value: "pro" },
  { attr: "country", op: "in", value: ["US","CA","UK"] },
]

// Long-tenured power users
[
  { attr: "tenure_days", op: "gte", value: 60 },
  { attr: "team_size",   op: "gte", value: 5 },
]

// Mobile app, version-gated
[
  { attr: "platform",    op: "eq",          value: "ios" },
  { attr: "app_version", op: "version_gte", value: "2.4.0" },
]
```

The dashboard shape is JSON, so you can copy these straight in — paste the array into the feature flag's targeting editor and click Save. The same JSON can be patched via the [Admin API](https://docs.shipeasy.ai/api).

## Rollout percentages

Rollout is deterministic. The SDK computes:

```
bucket = murmur3(salt + ":" + (user_id ?? anonymous_id)) % 10000
true   = bucket < rolloutPct
```

That gives you three properties:

- **Stable**: the same user always gets the same bucket for the same feature flag. No flicker on reloads, no flicker across servers.
- **Independent**: changing one feature flag's rollout doesn't move users on another feature flag (different salts).
- **Fair**: bucketing is uniform; small rollouts give a representative sample.

Internally we work in basis points (0..10000), so you can roll out at 0.01% granularity if you really need it.

### Rolling out safely

A safe rollout schedule for an unknown-risk change:

```
0%   → enable rule + dogfood with overrides
1%   → 1 hour, watch error rate + p95
5%   → 4 hours
25%  → overnight
50%  → 1 day
100% → keep an eye on it for a week, then delete the flag
```

For a known-low-risk change you can compress this. For anything load-bearing (auth, billing, the data path) — don't. The whole point of a gradual rollout is to find the surprise before it's 100% of your traffic.

> **Bumping percentage never reshuffles**

Going from 5% → 25% **adds** users to the bucket — the original 5% is still in. You won't see
a user flap from <code>true</code> back to <code>false</code> as you ramp up. The only way to
reshuffle is to bump the [salt](#salt).

### The salt [#salt]

Each feature flag has its own salt. If you ever want to **re-shuffle** the rollout buckets without changing the percentage (say, to avoid the same 5% always being chosen for every feature flag you ever roll out), bump the salt. CLI `flags update` doesn't expose a `--salt` flag today — bump it on the feature flag via the [Admin API](https://docs.shipeasy.ai/api) or edit the feature flag's JSON in the dashboard.

That's rare. The default salt is fine for almost every case. The salt is also why two feature flags at 50% don't serve the same 50% of users — different salts, different buckets, statistically independent.

## Combining rules + rollout

Rules are checked **before** rollout. Two practical implications:

1. <em>"100% of `plan = pro`"</em> means **all** pro users get `true`. The rollout filter
   doesn't fight the rule.
2. <em>"5% of `plan = pro`"</em> means **5% of pros**, not
   <em>"5% of everyone, then keep only pros"</em>. The bucket is computed against the
   pre-filtered population.

This is what you almost always want. If you genuinely need <em>"this proportion of the entire user base, but only if they're pro"</em>, add a second rule group: a global-rollout group first, then the `plan = pro` filter — see [first-match-wins](#first-match-wins-evaluation) below.

## Bucketing by something other than `user_id`

Default: bucketing key is `user_id ?? anonymous_id`. Override per-call:

```ts
// Set the gate's bucketing key in the dashboard (or PATCH the gate's
// `bucket_by` field via the Admin API) so every read uses the same key.
const flags = new Client(user);
flags.getFlag("new-team-ui");
```

Or on the feature flag itself in the dashboard. Use this in B2B so all teammates of an account see the same variant — half a team on the new UI and half on the old is a confusing user experience and an unanalysable rollout.

> **Don't bucket by mutable attributes**

Bucketing on <code>email</code> or <code>plan</code> means a user changes bucket whenever the
attribute changes. They'll see the feature flicker on and off. Always bucket on something
stable: <code>user_id</code>, <code>account_id</code>, or <code>anonymous_id</code>.

## First-match-wins evaluation

When a feature flag has multiple rule **groups** (the dashboard's "OR an additional cohort" affordance), the SDK evaluates them top to bottom and takes the **first match**. Each group can have its own rollout percentage and bucketing key.

```json title="multi-group rule"
[
  {
    "match": [{ "attr": "internal", "op": "eq", "value": true }],
    "rollout": 10000,
    "bucketBy": "user_id"
  },
  {
    "match": [{ "attr": "plan", "op": "eq", "value": "pro" }],
    "rollout": 500,
    "bucketBy": "account_id"
  }
]
```

Reads as: <em>"100% of internal users; 5% of pro accounts (consistent across teammates); everyone else gets the default."</em>

The order matters. If a user is both internal and pro, the first matching group wins — they get the 100% bucket, not the 5% one.

## Overrides vs rules

Use **rules** for cohorts you can describe — <em>"all internal users"</em>, <em>"all pro accounts"</em>. They scale.

Use **[overrides](https://docs.shipeasy.ai/flags/gates#overrides)** for individual user IDs — QA accounts, customers reporting a specific bug, demos. They're the trump card and bypass everything else.

If you find yourself adding many overrides, that's a smell — promote them to a rule keyed on a `internal: true` or `early_access: true` attribute and you'll thank yourself when the QA team turns over.

## Attributes that travel

Whatever attributes you bind onto the `Client` (via the `configure()` `attributes` transform) are also available to:

- [Feature flag rules](https://docs.shipeasy.ai/flags/gates/targeting) (for assignment and segmentation)
- [Dynamic values](https://docs.shipeasy.ai/flags/configs/values) decoders
- [Metric filters](https://docs.shipeasy.ai/metrics/grammar) (as the labels you slice a series by)

So define attributes once at the request boundary and pass the same `user` shape everywhere:

```ts title="src/lib/auth.ts"
export function buildEvalCtx(req: Request) {
  const session = getSession(req);
  return {
    user_id: session.user_id,
    plan: session.plan,
    country: geoFromReq(req),
    tenure_days: daysSince(session.created_at),
    app_version: req.headers.get("x-app-version") ?? "0.0.0",
  };
}
```

## Debugging a rule

The dashboard's **Test evaluator** panel takes a JSON context and shows the full evaluation trace — which rule matched, which didn't, what bucket the user landed in. Indispensable when a customer says "I should be in the beta, why am I not?". From your own code, `flags.getFlag(...)` returns the same evaluator result on every read — log the user context plus the result for the same answer in production.

**Related**

- [User attributes](https://docs.shipeasy.ai/get-started/attributes) — What you can write a rule against
- [Feature flag targeting](https://docs.shipeasy.ai/flags/gates/targeting) — The same predicates on a boolean
- [Rollouts & bucketing](https://docs.shipeasy.ai/flags/gates/rollouts) — How the percentage is decided
- [Private attributes](https://docs.shipeasy.ai/sdks/private-attributes) — Target on PII without storing it
