# Overrides

Source: https://docs.shipeasy.ai/flags/gates/overrides

> Force a feature flag on or off for specific user IDs — for QA, dogfood, demos, and customer-specific repros. Bypasses targeting and rollout.

An **override** is a per-user forced answer. It bypasses everything — targeting rules, rollout,
killswitch, even `enabled = false`. Use it for the four cases below; don't reach for it as a
general-purpose targeting tool.

## When to use overrides

- **QA accounts.** Force the new path on for QA users regardless of rollout state. You can fully test a feature at 0% rollout because the QA accounts are always-on.
- **Internal dogfood.** Your team always sees the latest version of every feature flag, ahead of customers.
- **Customer demos.** A specific demo account sees the brand-new feature for the screenshare, while everyone else stays on the stable path.
- **Bug reproduction.** A single customer reports a bug behind a feature flag. Override them to `on` so you can reproduce against their account without ramping the feature flag up.

## When _not_ to use overrides

If you're adding more than ~50 user IDs, you want a **targeting rule** on an attribute, not a
literal list of IDs. Examples of things that should be rules, not overrides:

- "All users on the `beta` plan." → Targeting rule on `plan eq "beta"`.
- "All users from a specific company." → Targeting rule on `email contains "@company.com"`.
- "All users in a country." → Targeting rule on `country in [...]`.

Overrides are a row-per-user lookup in KV; rules are O(1) regardless of population size. Rules
scale; overrides don't.

## Adding an override

In the dashboard: expand the feature flag, scroll to **Overrides**, add user IDs under **Always on** or
**Always off**.

A first-class `flags override` CLI subcommand isn't shipped yet. The
shortest path is the dashboard (feature flag detail → Overrides → paste user
IDs); for scripting, PATCH the feature flag via the
[Admin API](https://docs.shipeasy.ai/api):

```bash
GATE_ID=$(curl -sS \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  "https://shipeasy.ai/api/admin/gates?name=checkout-v2" | jq -r '.data[0].id')

curl -X PATCH "https://shipeasy.ai/api/admin/gates/$GATE_ID" \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "overrides": {
      "always_on": ["u_qa1", "u_qa2", "u_demo"],
      "always_off": ["u_legacy_partner"]
    }
  }'
```

To remove a specific override, GET the feature flag, drop the user from the
matching list, then PATCH it back. The `overrides` object is replaced
in full on each PATCH, so omitted lists are cleared.

## What overrides bypass

For a call `gate(name, ctx)` where `ctx.userId` is in the overrides list:

```
1. killswitch ON                  → STILL returns override decision   ← bypassed
2. enabled OFF                    → STILL returns override decision   ← bypassed
3. userId ∈ overrides[true]       → true                                ← here
4. userId ∈ overrides[false]      → false                               ← here
5. rules                          → not evaluated
6. rollout                        → not evaluated
```

The override sits at step 3–4 in [evaluation order](https://docs.shipeasy.ai/flags/gates/rollouts#bucketing-key)
and short-circuits everything below. Crucially, it also bypasses the killswitch — which is what
you want for QA (you can still test a killed feature) but is dangerous for production users.

> **Production accounts in always-on overrides**

Don't override a real customer to `always_on` for a feature that isn't ready. The override ignores
the killswitch — if you hit "kill" during an incident, the overridden customer still sees the
broken path. Use rules with a `customer_email` predicate instead.

## Override scope

- Overrides are keyed on **`ctx.userId`** only — literal string equality, no operators.
- No attribute matching. `plan = pro` cannot be expressed as an override; that's a rule.
- The list is scoped per-flag. A user being on the `always_on` list for `gate-a` says nothing about `gate-b`.

## Dashboard JSON shape

The override block is part of the feature flag's stored config:

```json
{
  "name": "checkout-v2",
  "enabled": true,
  "killswitch": false,
  "rolloutPct": 2500,
  "overrides": {
    "always_on": ["u_qa1", "u_qa2", "u_demo_alpha"],
    "always_off": ["u_legacy_partner_b"]
  }
}
```

You can `GET` and `PATCH` this shape directly via the admin API.

## Limits

How many overrides a single feature flag may carry is plan-derived — the [pricing
page](https://shipeasy.ai/pricing) has the matrix, **Settings → Billing** has yours.

If you're approaching the limit, you're almost certainly using overrides where you should be using
rules. Audit the list — most overrides are old QA accounts that should have been removed when the
feature flag was launched.

## Cleaning up after launch

Once a feature flag is at 100% and the feature is fully shipped, the override list is dead weight. Two
common patterns:

1. **Delete the feature flag.** Once you remove the conditional from code and clean up the dead path,
   delete the feature flag itself. The override list goes with it.
2. **Clear overrides.** Keep the feature flag (if you might want to reuse the name for a follow-up
   feature) but clear out the override list. PATCH the feature flag with
   empty arrays:
```bash
curl -X PATCH "https://shipeasy.ai/api/admin/gates/$GATE_ID" \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "overrides": { "always_on": [], "always_off": [] } }'
```

The dashboard's **Cleanup** view surfaces feature flags with stale overrides (overrides on a feature flag that's
been at 100% for >30 days) so you don't have to remember.

## Audit

Every override change is recorded — who added it, who removed it, when, from what surface
(dashboard, CLI, API). Find the audit trail under **Feature flag → History**. Particularly useful when a
customer reports a feature they're "always seeing" — the history tells you whether they were
overridden, by whom, and when.

**Related**

- [Targeting rules](https://docs.shipeasy.ai/flags/gates/targeting) — Eligibility for everyone else
- [QA a flag before you ramp](https://docs.shipeasy.ai/flags/case-studies/qa-with-devtools) — Overrides from the browser overlay
- [Debug a missing feature](https://docs.shipeasy.ai/flags/case-studies/debug-missing-feature) — Why a user did not get it
- [Evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) — How an override shows up in a detail read
