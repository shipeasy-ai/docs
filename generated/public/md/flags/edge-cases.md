# Edge cases

Source: https://docs.shipeasy.ai/flags/edge-cases

> Things that bite you once and never again — sticky bucketing, KV propagation, SSR flicker, flag sprawl, and more.

The patterns below are the ones you wish someone told you on day one.

- **[Sticky bucketing across devices](#sticky-bucketing)** — Same `userId` should see the same variant on web and mobile. Hashing strategy matters.

- **[Write propagation latency](#kv-propagation)** — Why a flip is sub-second 99% of the time and what to do for the 1%.

- **[Avoiding SSR/CSR flicker](#ssr-flicker)** — Pass server-evaluated flags to the client to skip the hydration mismatch.

- **[Fail-safe defaults when KV is unreachable](#fallback)** — What `gate()` returns and how to override per-call.

## Sticky bucketing across devices [#sticky-bucketing]

Bucketing is `hash(salt + identityKey) % 10_000`. The same `identityKey` always maps to
the same bucket, so the same user lands in the same variant on every device, in every session,
forever — as long as the key stays stable.

That stability is the whole trick. Pick the wrong key and "sticky" silently means "sticky per
device", "sticky per session", or "sticky until the cookie clears". Pick it once and pick it for
real:

```ts
import { gate } from "@shipeasy/sdk/server";

// Good — stable across devices and sessions
await gate("checkout-v2", { userId: session.user.id });

// Acceptable for logged-out — survives across sessions on one device
await gate("checkout-v2", { userId: anonymousIdFromCookie() });

// Bad — re-buckets every request, every reload, every tab
await gate("checkout-v2", { userId: crypto.randomUUID() });
```

If a visitor signs in mid-rollout they will re-bucket: anon cookie ID → real user ID changes
the hash input. That's almost always what you want (you'd rather attribute the conversion to the
signed-in user than to a throwaway), but it does mean you can't compare _the same user_ across the
sign-in boundary. If you need that — e.g. measuring sign-up rate itself — bucket on a stable
device id that survives auth, and pass `userId` separately for analytics only.

The platform never mutates the salt for you. If you regenerate it (delete + recreate the
flag, rename it in a way that changes the hash input), every user re-buckets and your
running results are invalid. Don't.

## Write propagation latency [#kv-propagation]

Edits in the dashboard write to D1, rebuild the KV blob, and explicit-purge the CDN edge cache.
P99 end-to-end is under a second; P50 is ~150ms. The SDK reads the KV blob, which is cached at the
nearest edge with an infinite TTL until purged — that's how the hot path stays sub-10ms.

The 1% case is when an edge node you're hitting hasn't seen the purge yet and serves the previous
blob. For most flags, that's fine: a user evaluates one extra request against the old value, then
the next evaluation has the new one. For _killswitches in an active incident_, "one extra request"
might be a thousand emails sent or a million dollars charged.

For instant-kill semantics, evaluate server-side at request time and short-circuit on the
killswitch before doing the dangerous thing:

```ts
import { gate } from "@shipeasy/sdk/server";

export async function POST(req: Request) {
  if (!(await gate("emails-enabled"))) {
    return new Response("paused", { status: 503 });
  }
  return sendEmail(await req.json());
}
```

The SDK has a small in-memory cache (default 10s) on top of the KV read. If you cannot tolerate
even that, pass `{ maxAge: 0 }` and pay one KV round-trip per call.

## SSR/CSR flicker [#ssr-flicker]

The default client-side `gate()` returns `false` on first render (no value yet), then the real
value on hydration. On a page where the flag controls a visible component, that's a flash of the
control variant before the treatment appears — exactly the flicker we don't want.

The fix is to evaluate on the server, ship the result down with the page, and hand it to the
client SDK so the first client render already has the right value:

```tsx
// app/page.tsx (Server Component)
import { gate } from "@shipeasy/sdk/server";
import { ShipeasyProvider } from "@/components/shipeasy-provider";

export default async function Page() {
  const flags = {
    "checkout-v2": await gate("checkout-v2", { userId }),
    "hero.title": await config<string>("hero.title"),
  };
  return (
    <ShipeasyProvider initial={flags}>
      <Page />
    </ShipeasyProvider>
  );
}
```

```tsx
// components/shipeasy-provider.tsx (Client Component)
"use client";
import { shipeasy } from "@shipeasy/sdk/client";
import { useEffect } from "react";

export function ShipeasyProvider({ initial, children }) {
  useEffect(() => {
    shipeasy({
      apiKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY!,
      initial,
    });
  }, [initial]);
  return children;
}
```

First client render reads `initial.checkout-v2`, matches the SSR output, no hydration mismatch. The
SDK takes over for subsequent evaluations.

## Fail-safe defaults [#fallback]

If KV is unreachable (network blip, cold start, transient edge issue), the SDK returns:

- `gate(name)` → `false`
- `config(name)` → last-known-good from the in-memory cache, else `undefined`

That's the safe default for **the common case**, where "feature off" is benign. The dangerous case
is when _off_ is the failure mode — a killswitch that defaults to `false` would un-pause emails
during an incident. Override per call:

```ts
// "off" is dangerous — default open, fail closed
await gate("emails-enabled", ctx, { defaultValue: true });
```

Set defaults at the call site, not in a wrapper. The defaultValue is the contract of "what does
this code do if Shipeasy is dead?" and it should be readable next to the code that depends on it.

## More edge cases

The four below are the second wave — failure modes that bite once you've shipped a dozen feature
flags, not on day one. One per primitive in this section's sub-menu.

- **[Feature flags → flag sprawl](#gate-sprawl)** — Dead feature flags at 100% are technical debt. How to find them and rip them out without breaking code.

- **[Configs → schema drift](#config-schema-drift)** — A dashboard value that no longer matches your code's expected shape. Schema validation + rollback strategy.

- **[Killswitches → decay](#killswitch-decay)** — A killswitch that hasn't been flipped in 6 months might still work. Or it might not. Rehearsal is the only way to know.

- **[Cross-env flag drift](#env-drift)** — Staging and prod versions of the same flag fall out of sync. How to find it before users do.

## Feature flag sprawl [#gate-sprawl]

After 12 months of shipping, you have 187 feature flags. Half are at 100% and have been for months. The
code that reads them is dead conditionals — a branch the linter still respects but no human will
ever take.

That's not aesthetic — it's a real cost:

- Every `if (await gate(...))` adds a layer of indirection in code review. New engineers spend time tracing why a 100% feature flag exists before realising it's dead.
- Removed features that left their feature flags behind become Chesterton's-fence puzzles — was this rolled back? Is it still in flight? Nobody remembers.
- Stale feature flags are still polled. The KV bundle isn't _huge_, but every feature flag's targeting rules and override list ship with every poll.

The Shipeasy **Cleanup** view surfaces candidates: feature flags at 100% or 0% for more than 30 days,
with no targeting rule changes in 60 days. Run through it monthly. For each candidate, three
options:

1. **Delete.** The default. The feature flag is at 100% (or 0%), the code branch behind it is settled —
   rip out the conditional, delete the feature flag.
2. **Convert to a killswitch.** If the feature flag is "at 100% but you want to keep the lever," promote
   it to a killswitch. Different semantics, different sub-menu, signals to the team it's
   incident-grade.
3. **Document why it stays.** Rare — usually because of a planned future change. Add a note to
   the feature flag description so a future cleanup pass doesn't axe it by mistake.

Automate step 1 with the CLI:

```bash
# Every gate at 100% rollout (filter to long-stable ones using the
# created_at field + your own threshold)
shipeasy release flags list | jq -r '.[] | select(.rolloutPct == 10000) | .name'

# Sanity-check the codebase no longer references each candidate before
# deleting — grep is the simplest correct tool:
git grep -nE "flags\\.get\\(['\"](dark-mode|checkout-v2|new-search)['\"]"

# Once nothing matches, delete them one at a time (the CLI's `delete`
# takes one name per invocation):
shipeasy release flags archive dark-mode
shipeasy release flags archive checkout-v2
shipeasy release flags archive new-search
```

The grep step is non-negotiable. Deleting a feature flag that's still referenced in code is fine
(the SDK returns the `defaultValue`), but you want the dead conditional gone too — otherwise
you've just moved the technical debt.

## Config schema drift [#config-schema-drift]

You stored a structured config — say a list of feature tiers with prices. Six months later, a
new engineer adds a `description` field to the type, ships the code, and reads the config:

```ts
const tiers = await config<Tier[]>("plans.tiers");
return tiers.map((t) => (
  <Card key={t.id} title={t.name} desc={t.description}>...</Card>
));
```

The dashboard JSON still has the old shape — no `description`. In dev, the cards render with
`undefined` where the description should be. In prod the same.

The cause: the _value_ in the dashboard is decoupled from the _shape_ in code. Adding a field to
the TypeScript type doesn't add it to the dashboard. The SDK doesn't validate.

Two patterns to defend against this:

### 1. Validate on read

Use a schema (Zod, Valibot, runtypes) and validate every read. Fall back to a safe default if
the parse fails, _and log loudly_ so you find out about the drift:

```ts
import { z } from "zod";

const TierSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  priceCents: z.number().int().nonnegative(),
});

const tiers = await config<unknown>("plans.tiers", { default: [] });
const parsed = z.array(TierSchema).safeParse(tiers);
if (!parsed.success) {
  reportToSentry("Config schema drift", { configName: "plans.tiers", issues: parsed.error.issues });
  return DEFAULT_TIERS;
}
return parsed.data;
```

The schema _defaults_ (`description: z.string().default("")`) absorb additive changes without
breaking. Removing a field still breaks — Zod's `strict()` would catch it.

### 2. Version the config name

When the shape changes incompatibly, rename:

```ts
// Old code path
const tiers = await config<TierV1[]>("plans.tiers.v1");
// New code path
const tiers = await config<TierV2[]>("plans.tiers.v2");
```

Two configs co-exist briefly while you migrate. Old shape readers keep working; new shape readers
look at the new name. When the migration's done, delete the old config. The dashboard treats them
as unrelated, so a typo in v2 doesn't break v1.

Use this for structural changes (renaming a field, changing a type). For additive changes, the
schema-with-defaults pattern is enough.

## Killswitches decay [#killswitch-decay]

A killswitch is only useful if it works during the incident. A killswitch that hasn't been
flipped in 6 months _probably_ still works — but you don't know.

Three failure modes silently break a killswitch:

1. **The wrapped code path was refactored.** Someone moved the dangerous call to a new function
   and forgot the `if (!(await gate(...)))` wrapper. The killswitch still exists; flipping it
   does nothing.
2. **A new code path bypasses it.** A worker, a batch job, or a webhook handler was added later
   that calls the same dangerous side effect without the wrapper. The killswitch covers the old
   path; the new path is naked.
3. **The webhook moved.** The PagerDuty integration URL changed, no one updated the
   `killswitch.flipped` webhook, flipping the kill no longer pages.

The fix is rehearsal. Once a quarter, run a drill in staging:

```bash
# Flip the killswitch ON (kill = true) for the drill
shipeasy release killswitch update transactional.emails-enabled --value true

# Run the canonical test that exercises every email-sending code path
pnpm test:integration --grep email

# Confirm zero emails went out, then restore
shipeasy release killswitch update transactional.emails-enabled --value false
```

If any test sent an email while the killswitch was off, you've found a naked code path. Fix
_before_ you need the killswitch in production.

The Shipeasy dashboard flags killswitches that haven't been flipped (in any env) in 90+ days
with a yellow "stale" chip. Treat that chip as "drill overdue."

## Cross-env flag drift [#env-drift]

You changed a feature flag in production. The same feature flag in staging is still on the old config. A week
later, a new dev tests against staging, sees v1 behaviour, ships code that depends on v1,
production breaks because production is on v2.

The cause is straightforward: feature flag config is per-environment, and there's no automatic sync.

Three patterns to keep envs aligned:

### 1. Mirror writes per-env

Today feature flags live at the project scope (not per-env) — the same rollout %
applies in staging and prod. To run different rollouts per env, create a
sibling feature flag per env (e.g. `checkout-v2.staging`, `checkout-v2.prod`)
and pin the SDK to the matching name based on which env's SDK key it's
booted with:

```bash
shipeasy release flags update checkout-v2.staging --rollout-percent 100
shipeasy release flags update checkout-v2.prod --rollout-percent 25
```

Per-env values on a single feature flag is on the roadmap — until then, the
naming convention is what enforces the boundary.

### 2. Diff env state by hand

A first-class env-diff tool isn't shipped today. Until it lands, the
practical pattern is to dump `shipeasy release flags list` from each env
(by re-binding to the appropriate project / SDK key) and `jq` the
delta:

```bash
shipeasy release flags list > staging.json
shipeasy release flags list > prod.json
diff <(jq -S . staging.json) <(jq -S . prod.json)
```

### 3. Promote rather than re-create

For new flags, create in staging, qualify, then _promote_ to prod rather than re-creating:

```bash
# Read the qualified definition out of one project and create it in the other
shipeasy release flags get checkout-v2 > checkout-v2.json

shipeasy release flags create checkout-v2 \
  --rules "$(jq -c .rules checkout-v2.json)" \
  --rollout-pct "$(jq -r .rolloutPct checkout-v2.json)" \
  --salt "$(jq -r .salt checkout-v2.json)"
```

Carrying the `--salt` across is what makes the two match: bucketing is
`hash(salt:unit)`, so the same salt puts the same users in the same slice.
Subsequent edits drift again unless you mirror them.

The trade-off you're navigating: dev velocity (different states per env) vs. release safety
(same behaviour everywhere). The right balance depends on whether your bugs tend to come from
"flag config diverged" or "I couldn't test the new state in staging." Most teams over-correct one
way or the other; pick consciously.
