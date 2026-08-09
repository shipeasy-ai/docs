# Rollouts & bucketing

Source: https://docs.shipeasy.ai/flags/gates/rollouts

> How the percentage actually works — sticky hashing, deterministic assignment, multi-arm rollouts, salt, and how to re-shuffle.

A **rollout** is the percentage of eligible traffic that gets the feature flag's `true` answer. The
implementation is deterministic hashing — same user, same feature flag, same answer, on every server, in
every SDK, forever (until you bump the salt). This page is the precise model of how that works.

## The hash

For a call `gate(name, ctx)`:

```
bucket = hash(salt || ":" || bucketBy(ctx)) mod 10_000
return bucket < rolloutPct * 100
```

- **`salt`** is per-flag (`name + ":" + saltVersion`). Defaults to the feature flag name and `"v1"`.
- **`bucketBy(ctx)`** is `ctx.userId` by default. Override per call with `{ bucketBy: "accountId" }`.
- The modulus is `10_000`, so rollout precision is 0.01% (basis points). The dashboard shows 0–100; internally the value is `0..10000`.
- The hash is `murmur3_32`. Cheap, well-distributed, identical across SDKs (server, browser, Python, Ruby, Go).

## Why it's sticky

The hash inputs are stable: the salt doesn't change unless you change it, and `userId` is whatever
identity you pass. The output is deterministic. So once a user lands in the "is in" half of a 50%
rollout, they stay there as long as the rollout is at or above their bucket.

That's the whole stickiness mechanism. No assignment table, no cookie, no server-side memory.

## Ramping up keeps existing users in

Bumping the rollout from 5% → 25% does _not_ re-bucket anyone. It changes the cutoff from `500` to
`2500`, which means buckets `[0..2499]` are now `true`. Every user who was inside the old `[0..499]`
range stays inside. The expansion is additive — new buckets become `true`; existing `true` buckets
stay `true`.

Same with ramping down. 25% → 5% kicks the users in `[500..2499]` back to `false`, but the users
in `[0..499]` are unaffected.

This is the property that makes progressive rollout safe: you can ramp confidently because no one
is randomly shuffled with each change.

## The bucketing key

`bucketBy` controls _what stickiness means_.

| Value       | Stickiness scope                                     | Use when                                      |
| ----------- | ---------------------------------------------------- | --------------------------------------------- |
| `userId`    | Per signed-in user, across devices and sessions      | Default. Almost always what you want.         |
| `accountId` | Per organisation — all teammates see the same thing  | B2B: rollout by company, not by seat.         |
| Cookie ID   | Per browser — survives across sessions on one device | Logged-out users on a marketing page.         |
| `requestId` | Per request — re-buckets every call                  | Don't. This is what bad bucketing looks like. |

Pick **once per feature flag** and stick with it. Switching `bucketBy` mid-rollout is the same as changing
the salt — every user re-buckets, your "5% who saw v2" is now a completely different 5%.

```ts
// B2B cohort consistency — all members of an account see the same variant.
// Set the gate's bucket_by to accountId in the dashboard; pass accountId on the bound client.
const flags = new Client({ userId, accountId });
flags.getFlag("admin-redesign");
```

## Salt — the re-shuffle lever

The salt is what makes two 50% rollouts not serve the same 50% of users. Each feature flag has its own
salt by default, so:

- `gate-a` at 50% returns `true` for users in buckets `[0..4999]` of `hash("gate-a:v1" + userId)`.
- `gate-b` at 50% returns `true` for users in buckets `[0..4999]` of `hash("gate-b:v1" + userId)`.

Different inputs to the hash → uncorrelated bucket distributions → independent rollouts.

You almost never bump the salt manually. The two cases where you would:

1. **You ran a 5% rollout, killed it, want to try the same feature on a _different_ 5%.** Bump the
   salt to `v2`. The new hash gives a different population. The original `[0..499]` users are no
   longer in the new bucket `[0..499]`.

2. **You're running back-to-back rollouts of related changes and don't want carryover.** Same
   logic — bump the salt so the second 50% split is independent of the first one's.

```bash
shipeasy release flags update checkout-v2
```

That's it. The whole rollout reshuffles. Use sparingly — every salt bump invalidates any analysis
that relied on "the same set of users."

## Multi-arm rollouts

A feature flag has one rollout percentage, so it gives you two arms and no more. For "70% A, 20%
B, 10% C," reach for a [config](https://docs.shipeasy.ai/flags/configs) holding the arm name and key it off the user's
bucket — three named values, one place to change the split, and the typed read your code already
does.

Whatever you pick, the split alone tells you nothing about which arm is better. Attach a
[metric](https://docs.shipeasy.ai/metrics/quickstart) to the outcome you care about and compare its series per arm.

## Bucket precision

The rollout field accepts integers from `0` to `100` in the UI (and `0..10000` basis points in the
API/CLI). Sub-percent resolution is sometimes useful:

```bash
# 0.5% — useful for cautious initial exposure on a high-traffic feature
shipeasy release flags update payments-v2 --rollout-pct 50
```

Internally, every rollout is a basis point. The UI rounds for display.

## Sticky bucketing across SDKs

Every Shipeasy SDK uses the same hash function, same salt format, same modulus. Server-side
evaluation (Node, Go, Ruby, Python) and client-side (browser, React Native) produce identical
bucket assignments for the same `userId` + salt.

That's how server-rendered pages can pre-evaluate a flag, ship the result to the client, and the
client SDK re-evaluates to the same answer. No mismatch, no hydration flicker. See
[Edge cases / SSR flicker](https://docs.shipeasy.ai/flags/edge-cases#ssr-flicker) for the SSR pattern.

## Anonymous and logged-out users

If you don't have a `userId`, the SDK still needs _something_ deterministic. Two options:

1. **Cookie-stored anonymous ID.** Generate once, persist in a `httpOnly` cookie, pass as `userId`.
   Stickiness survives across sessions on one device.

2. **IP-derived ID.** Only as a last resort — IPs change behind NAT, mobile carriers, VPNs, and
   you'll see the same user re-bucket. Use only when you have no other identifier and you're okay
   with that.

Don't fall back to `Math.random()`. The user re-buckets on every call, the variant flickers, and
event-stream analysis becomes meaningless.

## Debugging "why did this user get the rollout?"

The dashboard's **Test evaluator** panel takes a JSON user context and prints the same decision the SDK would compute — including which rule matched, the bucket the user fell into, and whether the bucket is below the rollout cutoff. Same answer as your code, no detour through a CLI.

If the dashboard's decision doesn't match what the user reports seeing, something is different about the `ctx` the SDK actually saw — usually a missing or differently-named attribute. Log the user you bind to the `Client` in production to compare.

**Related**

- [Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing) — Which id the hash is taken on
- [Multi-context bucketing](https://docs.shipeasy.ai/sdks/bucketby) — Bucket on company or session instead
- [Roll out to companies](https://docs.shipeasy.ai/flags/case-studies/company-rollout-bucketby) — A whole account flips together
- [Edge cases](https://docs.shipeasy.ai/flags/edge-cases) — What breaks stickiness
