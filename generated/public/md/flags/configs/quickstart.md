# Quickstart

Source: https://docs.shipeasy.ai/flags/configs/quickstart

> From zero to a feature behind a feature flag in production — install the SDK, create a feature flag, roll it out, kill-switch it, and watch it in the dashboard. Five minutes, end to end.

This walks through the full flow end to end: install the SDK, create a feature flag, put a feature flag around your code, roll it out gradually, then kill-switch it. By the end you'll have a feature behind a feature flag in production, evaluated locally with no per-request network call, that you can flip from your phone.

If you'd rather hand this to an AI agent, [wire up the MCP server](https://docs.shipeasy.ai/get-started/mcp) and ask for the same flow in plain language.

**Install the SDK & log in**

```bash
npm install @shipeasy/sdk && shipeasy login
```

**Create a feature flag at 0%**

```bash
shipeasy release flags create new-checkout-flow --rollout-percent 0
```

**Bump it to 5%, then 100%**

```bash
shipeasy release flags update new-checkout-flow --rollout-percent 5
```

## Prerequisites

- A Shipeasy project. Sign up at [shipeasy.ai](https://shipeasy.ai) — starting a project costs nothing.
- A **server SDK key** scoped to your environment. Find it in **Project → SDK keys → Create → server**, or generate one from the CLI:

```bash
shipeasy sdk keys create --type server
```

- The SDK installed in your project:

```bash
npm install @shipeasy/sdk
```

**Initialise the SDK**

Initialise once at boot. The server SDK polls flag updates in the background — no per-request cost, no fetch on the hot path.

```ts title="src/lib/shipeasy.ts"
import { configure } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan }),
});
```

Call this once from your entrypoint at boot. After that, every `new Client(user).getFlag()` call is synchronous and reads from in-process memory.

> **One configure call, one key**

Flags, dynamic values, and killswitches all share the same server key (passed as `apiKey`). Don't create per-feature wrappers in your codebase — the SDK owns its own initialisation.

**Create a feature flag**

From the CLI:

```bash
shipeasy release flags create new-checkout-flow --rollout-percent 0
```

Or in the dashboard: **Configs → Feature flags → New feature flag**, name `new-checkout-flow`, leave the rollout at `0%`. The default value is `false` — nobody sees the new path yet.

Naming conventions to save your future self pain:

- **kebab-case**: `new-checkout-flow`, not `newCheckoutFlow`.
- **Describe the change, not the abstract feature**: `enable-redis-pool` ages better than `redis-pool`.
- **Prefix by area**: `checkout-`, `nav-`, `infra-`. Makes deletion sweeps easy.

**Put a feature flag around your code**

**TypeScript**

```ts
import { Client } from "@shipeasy/sdk/server";

export async function getCheckoutComponent(user) {
  const flags = new Client(user);
  if (flags.getFlag("new-checkout-flow")) {
    return import("./checkout/new");
  }
  return import("./checkout/legacy");
}
```

**Python**

```python
flags = shipeasy.Client(user)
if flags.get_flag("new-checkout-flow"):
    return load_new_checkout()
return load_legacy_checkout()
```

**Go**

```go
flags := shipeasy.NewClient(user)
if flags.GetFlag("new-checkout-flow") {
    return loadNewCheckout()
}
return loadLegacyCheckout()
```

**Ruby**

```ruby
flags = Shipeasy::Client.new(user)
if flags.get_flag("new-checkout-flow")
  load_new_checkout
else
  load_legacy_checkout
end
```

**Java**

```java
Client flags = new Client(user);
if (flags.getFlag("new-checkout-flow")) {
    return loadNewCheckout();
}
return loadLegacyCheckout();
```

**Kotlin**

```kotlin
val flags = Client(user)
if (flags.getFlag("new-checkout-flow")) {
    loadNewCheckout()
} else {
    loadLegacyCheckout()
}
```

**PHP**

```php
$flags = new Shipeasy\Client($user);
if ($flags->getFlag('new-checkout-flow')) {
    return loadNewCheckout();
}
return loadLegacyCheckout();
```

**Swift**

```swift
let flags = try Client(user)
if await flags.getFlag("new-checkout-flow") {
    return loadNewCheckout()
}
return loadLegacyCheckout()
```

Bind a `Client` to your user once, then `getFlag()` is synchronous and reads from the in-process cache (the method is `get_flag` / `GetFlag` in the other SDKs). The `attributes` transform you passed to `configure()` resolves the user into the targeting context — at minimum `{ user_id }`. The shape of `user` is just a plain object:

```ts
{
  user_id: "u_4f2a",      // required for deterministic bucketing
  plan: "pro",            // any attribute your rules want
  country: "US",
  tenure_days: 142,
}
```

**Test locally with overrides**

Add yourself to the **overrides** list in the dashboard (**Feature flag → Overrides → Always on**, paste your `user_id`). The flag returns `true` for you and `false` for everyone else — no rollout math involved.

If you have the [browser DevTools overlay](https://docs.shipeasy.ai/get-started/sdks#devtools) loaded, you can also force a value with a query param:

```
https://app.local/?shipeasy_gate_new-checkout-flow=true
```

That's persisted in `localStorage` and survives reloads until you toggle it off.

**Roll it out gradually**

Bump the rollout from `0%` → `5%` → `25%` → `100%` over a few hours, watching your error rate and p95.

```bash
shipeasy release flags update new-checkout-flow --rollout-percent 5
shipeasy release flags update new-checkout-flow --rollout-percent 25
shipeasy release flags update new-checkout-flow --rollout-percent 100
```

Bucketing is deterministic by `user_id`, so the same 5% always sees the new path. You won't see flicker as you bump the percentage — you only ever **add** users to the bucket, never reshuffle.

A safe schedule for an unknown-risk change:

```
0%   → enable rule + dogfood with overrides
1%   → 1 hour, watch error rate + p95
5%   → 4 hours
25%  → overnight
50%  → 1 day
100% → keep an eye on it for a week, then delete the flag
```

**Killswitch (when something breaks)**

If something goes wrong, flip the killswitch. It overrides every targeting rule and serves `false` everywhere within the SDK's next poll.

```bash
shipeasy release flags disable new-checkout-flow
```

`flags disable` is the feature-flag-level off switch. `enabled` is a separate field from the feature flag's `rolloutPct` + targeting rules, so flipping it preserves them — `shipeasy release flags enable new-checkout-flow` restores the full prior state. For incident-grade flips on a different control surface, use a [killswitch](https://docs.shipeasy.ai/flags/killswitches).

**Wire it into CI**

A first-class `flags validate` CLI step isn't shipped today. As a stand-in, dump the project's
flags list and grep your source for any name that no longer exists:

```bash title=".github/workflows/ci.yml"
- name: List flags + grep stale references
  run: |
    shipeasy release flags list | jq -r '.data[].name' > /tmp/known-flags.txt
    # fail if a getFlag("…") call references a name not in the file
    git grep -hoE 'getFlag\("[^"]+"' src | sed -E 's/.*"([^"]+)".*/\1/' | sort -u > /tmp/used-flags.txt
    comm -23 /tmp/used-flags.txt /tmp/known-flags.txt | tee /tmp/stale.txt
    [ -s /tmp/stale.txt ] && { echo "Stale flag references found"; exit 1; } || true
```

## What just happened

When you flipped that rollout from `25` to `100`, Shipeasy propagated the change worldwide. Within
one SDK poll interval, every server saw the new value.

No deploy. No restart. No backend round-trip on the read.

> **What you just got for free**

An audit log of every change, side-by-side dashboards for the affected feature flag, deterministic
bucketing per user, and a kill-switch you can hit from your phone. You didn't have to build
any of it.

## Where to next

- **[Add precision](https://docs.shipeasy.ai/flags/configs/targeting)** — Replace <em>"5% of everyone"</em> with <em>"100% of plan=pro in country=US"</em>.

- **[Tune values without code](https://docs.shipeasy.ai/flags/configs/values)** — <code>pricing.base = 9.99</code> can be a config, not a constant.

- **[Add a killswitch](https://docs.shipeasy.ai/flags/killswitches)** — Wrap critical paths so you can disable them instantly during an incident.

- **[Measure, don't guess](https://docs.shipeasy.ai/metrics/quickstart)** — Once the value is remote, define a metric on the events it moves and watch it change.

**Related**

- [Dynamic values](https://docs.shipeasy.ai/flags/configs/values) — Types, defaults, and what changes without a deploy
- [Targeting & rollouts](https://docs.shipeasy.ai/flags/configs/targeting) — Different values for different users
- [Plan entitlements with a config](https://docs.shipeasy.ai/flags/case-studies/entitlements-with-configs) — One config instead of a flag sprawl
- [Reacting to changes](https://docs.shipeasy.ai/sdks/onchange) — Invalidate a cache when a value flips
