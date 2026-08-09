# Evaluation & caching

Source: https://docs.shipeasy.ai/get-started/evaluation-and-caching

> The read path in depth — in-memory rules, deterministic murmur3 bucketing, background polling, KV blobs, and infinite-TTL CDN propagation.

Evaluation is **local, deterministic, and sub-second to update**. Your code never makes a per-request network call to decide a flag. Here is exactly how the read path works.

## The rule set lives in memory

When you call `configure()` on the server, the SDK fetches your rule set once and holds it in memory. Every `getFlag` / `getConfig` / `universe().assign()` call evaluates against that in-memory snapshot — no I/O on the hot path.

```ts
import { Client } from "@shipeasy/sdk/server";

// No await, no network — pure local evaluation against the cached rule set:
const flags = new Client({ user_id: userId });
if (flags.getFlag("checkout-v2")) {
  /* ... */
}
```

This is why evaluation is synchronous and fast enough to call in a render path. The cost of "is this flag on?" is a hash, not a round trip.

## Deterministic murmur3 bucketing

Fractional rollouts are decided by hashing the unit:

```
segment = murmur3(`${salt}:${unitId}`) % 10000
on = segment < rolloutPct        // rolloutPct is an integer 0–10000
```

- **Same input, same bucket.** The same `unitId` always lands in the same segment, so a user who is in the first 25% stays in as you ramp to 50% — nobody flickers out.
- **Cross-language identical.** Every SDK uses `MurmurHash3_x86_32`, seed 0, UTF-8 bytes. A user buckets the same way in your Node SSR, your Go backend, and your browser bundle. The hash is published as a fixed test-vector table so every language agrees byte-for-byte.
- **Integer math, no floats.** Rollout percentages are stored as integers `0–10000` (basis points). Comparison is pure integer — no float drift across languages.

> **Change the salt, reshuffle everybody**

The salt is part of the hash input, so bumping a flag's salt moves every user to a fresh bucket.
That is the escape hatch when you want to re-run a 5% ramp on a *different* 5% — and the reason
not to touch it mid-rollout. See [Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing).

## Background polling at the plan interval

The SDK keeps its in-memory rules fresh by polling in the background — never on your request path.

**Conditional fetch**

Each poll sends an `If-None-Match` with the last `ETag`. Unchanged rules come back `304 Not
Modified` with no body — cheap, and the CDN absorbs it.

**Plan-driven cadence**

The flags blob polls at your plan's interval. The Worker returns an `X-Poll-Interval` header and
the SDK auto-adjusts to it, so changing a plan lever re-paces every SDK on that plan with no
redeploy. The second blob polls on a longer, fixed cadence — its contents change far less often.

**Timers don't block shutdown**

On the server the poll timers are `unref`'d, so they never keep a process alive. In serverless,
fetch once with no background poll — the rules are valid for the life of the invocation.

Polling — not streaming. There are **no** Server-Sent Events and **no** Durable Objects: those need persistent connections, which break in serverless (Lambda, Vercel, Workers, PHP-FPM). Polling at the plan interval is correct everywhere and the CDN makes it nearly free.

## Two KV blobs per project

Your rules are served from Cloudflare KV as two separate blobs, fronted by the CDN:

- `:flags` (KV blob) — Gates + dynamic configs. Changes often; served via `/sdk/flags`. This is what your server SDK polls at the plan interval.
- `:experiments` (KV blob) — The long-lived half of the rule set. Served via `/sdk/experiments` with a longer cache window.

They are split on purpose: a gate change shouldn't invalidate the other blob's cache, and vice versa. Browser clients hit `/sdk/evaluate`, where the Worker reads **both** blobs, evaluates server-side, and returns a flat map — so the client never sees raw rules.

D1 is the source of truth. KV is a globally replicated cache built from D1. Readers on the hot path **never** touch D1.

## Infinite TTL + explicit purge

This is the propagation model, and it's the opposite of what most CDNs do.

The KV blobs are cached at the edge with an effectively **infinite TTL** — they never expire on a timer. Instead, **every write explicitly purges** the relevant blob:

1. You change a flag (UI, CLI, or MCP).
2. The writer rebuilds the affected KV blob from D1.
3. The writer issues an explicit CDN purge for that blob.
4. The next request repopulates the edge from the fresh blob.
5. Your SDK picks it up on its next background poll.

```
edit → rebuild :flags → purge CDN → next poll sees new ETag → in-memory rules swap
```

> **Why infinite-TTL beats timed expiry**

A TTL forces a tradeoff: short TTL = constant origin load + cache misses; long TTL = stale rules.
Explicit purge gives you **both** — the cache stays warm indefinitely **and** changes go live in
roughly the time it takes the purge to fan out (~150ms). The purge API is free.

## Sub-second time-to-visible

Add it up: purge fan-out (~150ms) plus the time until your SDK's next background poll returns a fresh `ETag`. In practice an edit is visible to your fleet **in under a second**. Because evaluation is local, once the new rules are in memory every subsequent `getFlag` reflects the change with zero added latency.

> **Re-render on change**

The server SDK fires `onChange` listeners after a poll returns new data (HTTP 200, not 304) —
invalidate a cache or re-render when a flag flips. The browser SDK exposes the equivalent
`subscribe()`.

**Related**

- [Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing) — what unitId feeds the hash
- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — which env the blobs are scoped to
- [Rollouts](https://docs.shipeasy.ai/flags/gates/rollouts) — ramps and per-condition rollout
- [Pricing](https://shipeasy.ai/pricing) — what the poll interval is on each plan
