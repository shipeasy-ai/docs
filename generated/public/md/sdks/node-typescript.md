# Node / TypeScript

Source: https://docs.shipeasy.ai/sdks/node-typescript

> The canonical Shipeasy SDK — one package with a server and a browser build, local evaluation, configs, kill switches, and metric tracking.

> **Note**
Generated from the TypeScript / JavaScript SDK repo's own `/docs/` — the same Markdown `shipeasy docs get --sdk typescript overview` returns, served raw at [`https://shipeasy-ai.github.io/sdk-ts/pages/overview.md`](https://shipeasy-ai.github.io/sdk-ts/pages/overview.md). Edit it in the SDK repo, not here.

`@shipeasy/sdk` is the TypeScript / JavaScript SDK for the [Shipeasy](https://shipeasy.ai)
hosted platform — feature gates, runtime configs, kill switches, A/B
experiments, metrics, and i18n. It ships **two entrypoints** from one package:

- `@shipeasy/sdk/server` — Node, Cloudflare Workers, Deno (authenticates with the **server** key).
- `@shipeasy/sdk/client` — the browser (authenticates with the public
  **client** key).

The APIs are framework-agnostic: everything works from vanilla JS, which is why
there is no React wrapper package to install — a component reads a flag the
same way a route handler does.

## Install

```bash
npm install @shipeasy/sdk
# or
pnpm add @shipeasy/sdk
# or
yarn add @shipeasy/sdk
```

Full wiring — frameworks, options, env vars — is in [Installation](https://docs.shipeasy.ai/sdks/reference/typescript/installation).

## Mental model: `configure()` once, then `new Client(user)`

Configure the SDK **once** at app startup with your key and an optional
`attributes` transform from your own user object to Shipeasy targeting
attributes. Then evaluate **per user** with `new Client(user)`. The bound
`Client` takes no user argument on its methods — the user is bound at
construction.

```ts
import { configure, Client } from "@shipeasy/sdk/server"; // or /client

configure({ apiKey: process.env.SHIPEASY_SERVER_KEY!,
            attributes: (u: MyUser) => ({ user_id: u.id, plan: u.plan }) });

const flags = new Client(currentUser);
if (flags.getFlag("new_checkout")) { /* ship it */ }
```

## What `configure()` and `Client` do

- **`configure({ apiKey })`** is the one-time setup call. It owns the key, the HTTP transport, the blob cache, and the poll lifecycle for the whole process — the first call wins, later calls are no-ops. Test/offline siblings: `configureForTesting()` and `configureForOffline()` (see [Testing](https://docs.shipeasy.ai/sdks/reference/typescript/testing)).
- **`new Client(user)`** is a cheap, user-bound handle. It opens no connection and runs no poller — it just binds the resolved attribute bag once at construction. Construct one per user / per request. It exposes `getFlag`, `getFlagDetail`, `getConfig`, `universe(name).assign()`, `getKillswitch`, plus `track(event, props?)` — so reading an experiment (which auto-logs its exposure) **and** recording its conversion are end-to-end `Client`-only.

That is the entire surface you wire up: configure once, then `new Client(user)`
everywhere you evaluate.

## Where to go next

| Page | What it covers |
| --- | --- |
| [Installation](https://docs.shipeasy.ai/sdks/reference/typescript/installation) | install command, runtime versions, import lines |
| [Configuration](https://docs.shipeasy.ai/sdks/reference/typescript/configuration) | `configure()`, `attributes`, env vars, SSR bootstrap |
| [Flags](https://docs.shipeasy.ai/sdks/reference/typescript/flags) | `getFlag`, `getFlagDetail`, defaults |
| [Configs](https://docs.shipeasy.ai/sdks/reference/typescript/configs) | `getConfig` typed values + defaults |
| [Kill switches](https://docs.shipeasy.ai/sdks/reference/typescript/killswitches) | `getKillswitch` semantics |
| [Error reporting](https://docs.shipeasy.ai/sdks/reference/typescript/error-reporting) | `see()` grammar |
| [Testing](https://docs.shipeasy.ai/sdks/reference/typescript/testing) | `configureForTesting`/`configureForOffline`, `override*` |
| [OpenFeature](https://docs.shipeasy.ai/sdks/reference/typescript/openfeature) | server + web providers |
| [Advanced](https://docs.shipeasy.ai/sdks/reference/typescript/advanced) | manual exposure, private attrs, bucketBy, sticky |

The blocks below are the SDK repo's own snippets — the same ones `shipeasy docs get --sdk typescript release/flags` returns, with a worked example baked in.

## Feature flags

Read a feature flag per user with a bound `Client`. Assumes `configure()` ran at startup — see Installation.

```ts
import { Client } from "@shipeasy/sdk/server"; // or "@shipeasy/sdk/client"

// construct once per callsite (cheap; binds the user + runs the attributes transform)
const flags = new Client(currentUser);

// getFlag(name, defaultValue?)
//   name         — the flag/gate name
//   defaultValue — returned ONLY when the flag can't be evaluated
//                  (client not ready / flag not found); defaults to false
if (flags.getFlag("new_checkout", false)) {
  // ship it
}
```

## Dynamic configs

Read a typed dynamic config (with a default when the key is absent). Assumes `configure()` ran at startup — see Installation.

```ts
import { Client } from "@shipeasy/sdk/server"; // or "@shipeasy/sdk/client"

// construct once per callsite (cheap; binds the user)
const flags = new Client(currentUser);

// getConfig<T>(name, opts?)
//   name             — the config name
//   opts.defaultValue — returned when the config key is absent
//   opts.decode       — optional (raw) => T to validate/shape the stored value
const cfg = flags.getConfig<{ max: number }>("billing_copy", {
  defaultValue: { max: 50 },               // used when the key isn't published
  decode: (raw) => raw as { max: number }, // optional — typed decode / zod parse
});
```

## Kill switches

Read a kill switch (not user-bound — global on/off, optionally per-switch). Assumes `configure()` ran at startup — see Installation.

### Whole kill switch

```ts
import { Client } from "@shipeasy/sdk/server"; // or "@shipeasy/sdk/client"

// construct once per callsite (cheap; binds the user)
const flags = new Client(currentUser);

// getKillswitch(name, switchKey?)
//   name      — the kill switch name
//   switchKey — optional; reads a single named override switch instead of
//               the whole-killswitch "killed" flag
if (flags.getKillswitch("payments")) {
  // killed — short-circuit the feature
}
```

### Named switch (with fallback)

```ts
const flags = new Client(currentUser); // construct once per callsite

// Pass the variable to gate as the switchKey. A CONFIGURED switch returns its
// own value; an UNCONFIGURED switch falls back to the whole-killswitch "killed"
// value — so this is always safe to call before any per-key override exists.
if (flags.getKillswitch("payments", "apple_pay")) {
  // the "apple_pay" switch is on (or the whole kill switch is killed)
}
```

## Track a conversion

Track a metric/conversion event from the bound `Client`. Metrics in the
dashboard are computed from these events. Assumes `configure()` ran at startup —
see Installation.

### Track an event

```ts
import { Client } from "@shipeasy/sdk/server"; // or "@shipeasy/sdk/client"

// construct once per callsite (cheap; binds the user)
const flags = new Client(currentUser);

// track(eventName, props?)
//   eventName — the event your metric is built on (required)
//   props     — optional payload; numeric/string fields you can sum/filter on
//               in a metric (private attributes are stripped before egress)
flags.track("checkout_started", { amount: 49, currency: "usd" });
```

Fire-and-forget (never blocks your response) and a no-op under
`configureForTesting()` / `configureForOffline()`. The unit is the bound user
(`user_id`, else `anonymous_id`); with no unit the call is a no-op.

### Track without properties

```ts
const flags = new Client(currentUser); // construct once per callsite

flags.track("checkout_started"); // props are optional
```

**Related**

- [TypeScript / JavaScript full reference](https://docs.shipeasy.ai/sdks/reference/typescript) — Every feature page
- [Shared evaluation model](https://docs.shipeasy.ai/sdks) — How every SDK buckets
- [Testing](https://docs.shipeasy.ai/sdks/reference/typescript/testing) — Seed values, zero network
- [Error reporting](https://docs.shipeasy.ai/sdks/reference/typescript/error-reporting) — The see() surface
