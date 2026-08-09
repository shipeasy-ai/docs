# How it works

Source: https://docs.shipeasy.ai/get-started/overview

> A tour of the moving pieces — two runtimes, one shared database, config blobs at the edge, and an SDK that never blocks your request.

Shipeasy splits the world into two runtimes — an admin app and an edge worker — sharing one database and a handful of config blobs. Reading a flag or a config is a local memory lookup. Changing one purges a single CDN URL and propagates worldwide in under a second.

Shipeasy is built around one rule: **the read path is fast and the write path is explicit.** Reading a flag or a config should never block your request. Changing one should be visible globally within a second of the dashboard click.

That single rule decides almost every architectural choice — no per-request fetches, no TTL-based invalidation, no streaming sockets. Just config blobs at the edge, polled in the background, and purged on change.

## The two-runtime split [#two-runtimes]

- **[Admin app — writes](#admin-app)** — Dashboard, REST API, Server Actions, sessions, and the CLI's programmatic surface. This is where humans (and the CLI) make changes.

- **[Edge worker — reads](#edge-worker)** — Serves <code>/sdk/flags</code>, <code>/sdk/experiments</code>, <code>/sdk/labels</code>, ingests events at <code>/collect</code>, and runs the cron analysis pipeline.

- **[Shared state — one source of truth](#shared-state)** — The database is the row store. KV is the read cache. The events store is append-only telemetry. All three are scoped per project.

- **[Analysis — Cron + Queues](#analysis)** — A scheduled trigger enqueues one job per project. The consumer runs the t-test and writes results back to the database.

### Admin app [#admin-app]

The admin app is a Next.js app that owns:

- The dashboard UI for feature flags, configs, kill switches, metrics and alerts.
- Server Actions and Route Handlers — the same endpoints the CLI calls.
- Stateless JWT sessions (short expiry, no session table).
- The KV rebuild + CDN purge pipeline. Whenever you change a flag, the admin app rebuilds the affected blob and purges the URL.

Writes never go straight to KV from the dashboard. They go to the database first (the row of truth), then a rebuild helper reassembles the blob and writes it back, then an explicit purge invalidates the CDN.

### Edge worker [#edge-worker]

The edge worker is a separate, read-mostly, stateless service. Two endpoint groups matter:

- **`/sdk/*`** — what your SDK polls. Returns the config blob unchanged. Cached at the edge with a long TTL; the admin's purge step is what makes the cache eventually-consistent.
- **`/collect`** — fire-and-forget event intake. Returns `202` immediately. Your code path doesn't wait on it.

The same worker also handles the CLI device-auth flow and runs the cron + queue analysis pipeline.

### Shared state [#shared-state]

- `Database (SQLite)` (row store) — Source of truth — feature flags, configs, kill switches, metrics, keys, exposures, daily results. Project-scoped on every query.
- `KV` (read cache) — Two blobs per project: `:flags` (feature flags, configs and kill switches) and  `:experiments`, the longer-lived half of the rule set.
- `Events store` (event store) — Append-only telemetry. Written from the worker only, never from the admin app.
- `Queues` (async pipeline) — The cron enqueues one message per project. The consumer runs analysis and writes results back to the database.

## The lifecycle of a write

When you flip a flag, six things happen — all within about a second. The write path
fans out from the admin app; the read path and event ingestion live entirely on the
edge worker; analysis closes the loop back to the database overnight.

**You change something in the dashboard or CLI**

A flag flipped, a rollout bumped, a config published. The CLI hits the same Server Action the
dashboard does — there is no second API.

**The admin app writes the row to the database**

The database is the source of truth. Every other surface (config blob, daily analysis row,
dashboard table) is derived from a row.

**The config blob is rebuilt**

The rebuild helper assembles the full project blob — every feature flag, every config, every
targeting rule — into a single JSON payload. Rebuild is cheap because the project is small; we
don't do partial updates.

**The blob is written to KV**

KV propagation is sub-second between edge locations. The blob is small (a few KB for most
projects, low MB for large ones).

**The CDN URL is purged**

Reads are cached at the edge with **infinite TTL**. The purge invalidates the single URL that
points at the project's blob — every other project's cache stays warm.

**Your SDK polls and picks up the change**

Server SDKs poll on a plan-driven interval. Browser SDKs poll on the same cadence in the
background, and re-evaluate on `identify(...)`. Total time-to-visible from the dashboard click
is < poll interval + ~100ms of CDN propagation.

> **Why infinite TTL and not, say, 30 seconds?**

TTL-based invalidation makes the worst-case latency equal to the TTL. Explicit purge makes the
worst-case latency equal to the CDN propagation time, which is sub-second worldwide. The only
downside — coordinating the purge — is a problem the admin app already solves on every write.

## The lifecycle of a read

The other direction is much shorter — and on purpose.

**Your code asks the SDK**

`new Client(user).getFlag("new-checkout")`. Synchronous. No Promise.

**The SDK evaluates locally**

The full rule set for every feature flag in your project lives in process memory. Targeting
rules and rollout buckets are evaluated against the user object you passed in. Bucketing is
deterministic — same user, same answer, every time.

**A background poll keeps the bundle fresh**

A worker thread (Node) or `setInterval` (browser) re-fetches the config blob on the plan-driven
cadence. If the body is unchanged the SDK does nothing; if it changed, the in-memory rule set
swaps atomically.

**Exposure events are batched**

An evaluation queues a small exposure event recording what the user was shown. Events are
flushed to <code>/collect</code> in batches — `sendBeacon` on page hide in the browser, periodic
flush + on-process-exit on the server.

There is no per-evaluation network call, no rate limit on `getFlag()`, and no async surface to wrap. The cost of an evaluation is approximately the cost of a hash plus a few comparisons.

## Two SDK builds, one package

`@shipeasy/sdk` ships **server** and **browser** builds in the same npm package, picked by your bundler via conditional exports (`node` → `dist/server`, `browser` → `dist/client`). Both share the same evaluation core, but differ in their environment assumptions:

- `Server build` (@shipeasy/sdk/server) — For Node, Workers, Bun, Deno, RSC. Polls in the background. Bind a `Client` to the user, then read with no per-call user argument.
- `Client build` (@shipeasy/sdk/client) — For browsers. Manages an `anonymous_id` cookie. Identifies once, reuses the user. Ships a devtools overlay.

For the native server SDKs (Go, Python, Ruby, Java, Kotlin, PHP, Swift) the evaluation model is identical — same blob, same deterministic bucketing. See the [SDKs](https://docs.shipeasy.ai/sdks) reference.

## Plan-driven knobs

A handful of behaviours are plan-derived rather than per-project. The big one is the **SDK poll interval** — the worst-case lag between an edit going live at the edge and a given SDK instance noticing it. Evaluation itself is local and instant on every plan; only the refresh cadence moves.

You never configure it. The worker advertises the current value in the `X-Poll-Interval` response header and the SDK re-paces itself on the next poll, so a plan change propagates through the next KV rebuild with no redeploy and no per-project migration. Your plan's interval is on the [pricing page](https://shipeasy.ai/pricing) and on **Settings → Billing**.

## Identity model

A two-tier identity is enough for almost every use case:

```ts
import { configure, Client } from "@shipeasy/sdk/client";

configure({
  clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "",
  attributes: (u) => ({
    user_id: u.id, // your stable user ID, set after login
    plan: u.plan,
    country: u.country,
    beta_tester: u.betaTester,
  }),
});

// Bind a client to the current user; getters take no user argument.
const flags = new Client(currentUser);
```

Shipeasy buckets by `user_id ?? anonymous_id`, so a user gets a stable assignment before _and_ after login. The `anonymous_id` is auto-managed by the browser SDK (first-party cookie). When `identify(...)` runs after anonymous activity, the SDK emits an internal alias record so the daily analysis stitches the pre-login exposures to the post-login `user_id` — no explicit alias call required.

For B2B, you can bucket by `company_id` instead, so all teammates see the same variant. See [Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing) for the full guide.

## What we deliberately don't do

> **Trade-offs in plain English**

- **No per-request fetch from the SDK.** The bundle is in process memory. - **No TTL-based KV invalidation.** Writes purge the affected URL explicitly. - **No streaming sockets.** Polling at plan interval is good enough for flag changes and removes a class of operational headaches. - **No vendor lock-in for your data.** Events and metric series are plain rows in your database — exportable, queryable, yours.

## Where to next

- **[Install](https://docs.shipeasy.ai/get-started/install)** — Add the packages to your project and your machine.

- **[Quickstart](https://docs.shipeasy.ai/get-started/quickstart)** — The shortest path from install to a flag in production.

- **[Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments)** — Which key goes where, and how environments are scoped.

**Related**

- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — the read path in depth
- [Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing) — who gets what
- [SDKs](https://docs.shipeasy.ai/sdks) — every language
