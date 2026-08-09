# SDKs

Source: https://docs.shipeasy.ai/sdks

> One package for JavaScript (server + browser) plus seven native server languages — all evaluating the same blob, the same way.

The TypeScript package ships a server and a browser build. Seven native server SDKs — Go, Python, Ruby, Java, Kotlin, PHP, Swift — speak the same wire format and run the same deterministic evaluation locally.

Every Shipeasy SDK is a thin client over two cached blobs — `:flags` (gates + configs + kill switches) and `:experiments`, the longer-lived half of the rule set. The SDK polls them in the background and **evaluates locally**: there is no per-call network round-trip on your hot path.

## The shared evaluation model

All SDKs implement the same contract, so a flag buckets identically whether the call runs in Node, Go, or Swift:

- **Deterministic bucketing.** The rollout bucket is `murmur3("salt:unit") % 10000`. The hash is the cross-language MurmurHash3 x86_32 variant (seed 0), verified against shared test vectors — the same `user_id` lands in the same bucket in every language.
- **Local evaluation.** Targeting rules and rollout all run in-process against the polled blob. See [Feature gates](https://docs.shipeasy.ai/flags/gates) for the rule model.
- **One unit, server + browser.** Logged-out traffic buckets on a shared first-party `__se_anon_id` cookie, so the server and the browser bucket a visitor the same way.
- **ETag polling.** Each poll sends `If-None-Match`; a `304` skips the parse. The poll interval is plan-driven and pushed via the `X-Poll-Interval` header.

> **The Node SDK is canonical**

When a native SDK and the TypeScript SDK disagree, the TypeScript SDK is the reference
implementation. Native pages stay idiomatic to their language but never add method names that
contradict it.

## Configure once, bind a client

Every SDK leads with the same ergonomic flow: a one-time global `configure(...)` (server key or client key, plus an optional `attributes` transform that maps **your** user object onto the Shipeasy attribute map), then a lightweight, user-bound `Client` whose getters take **no** user argument.

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY!,
  attributes: (u) => ({ user_id: u.id, plan: u.plan }),
});

const flags = new Client(currentUser);
flags.getFlag("new_checkout");
```

The heavyweight polling state lives in an `Engine` behind `configure()` — engine-level features (testing, offline snapshots, `onChange`, manual exposure, private attributes, sticky bucketing) are configured there. The older per-call `getFlag(name, user)` form still works on the `Engine` directly for back-compat.

## What every SDK supports

| Capability        | Bound-client shape                    | Notes                                                               |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Feature flags     | `getFlag(name[, default])`            | Boolean; default returned only when unevaluable                     |
| Dynamic configs   | `getConfig(name[, default])`          | Typed JSON value with targeting                                     |
| Evaluation detail | `getFlagDetail(name)`                 | `{ value, reason }` — see [Reasons](https://docs.shipeasy.ai/sdks/reasons)                  |
| Event tracking    | `track(event, props)`                 | Fire-and-forget metric ingestion                                    |
| Change listeners  | `Engine.onChange(cb)`                 | Fires after a poll brings new data — see [onChange](https://docs.shipeasy.ai/sdks/onchange) |
| Offline snapshot  | `Engine.fromFile` / `fromSnapshot`    | Zero-network eval against a captured blob                           |
| Test utilities    | `configureForTesting()` + `override*` | No key, no network — see [Testing](https://docs.shipeasy.ai/sdks/testing)                   |

Defaults are returned **only when a value can't be evaluated** (client not ready, or the key isn't in the blob). A flag that legitimately evaluates `false` returns `false`, never the default.

## Pick your language

- **[Node / TypeScript](https://docs.shipeasy.ai/sdks/node-typescript)** — The canonical SDK. Server + browser builds in one package.

- **[Browser & React](https://docs.shipeasy.ai/sdks/browser-react)** — Client-key build, identify, devtools overlay, SSR bootstrap.

- **[Go](https://docs.shipeasy.ai/sdks/go)** — Context-aware client, servlet-style middleware for anon ids.

- **[Python](https://docs.shipeasy.ai/sdks/python)** — WSGI + ASGI middleware, decode hooks, dataclass results.

- **[Ruby](https://docs.shipeasy.ai/sdks/ruby)** — Fork-safe singleton, Rails railtie, view helpers.

- **[Java](https://docs.shipeasy.ai/sdks/java)** — AutoCloseable client, servlet AnonIdFilter, Spring-friendly.

- **[Kotlin](https://docs.shipeasy.ai/sdks/kotlin)** — Coroutine init, JVM/Android, `use {}` lifecycle.

- **[PHP](https://docs.shipeasy.ai/sdks/php)** — PHP-FPM friendly, per-request init, Laravel/WordPress hosts.

- **[Swift](https://docs.shipeasy.ai/sdks/swift)** — async/await, iOS 15+/macOS 12+, server-key only.

**Related**

- [Install Shipeasy](https://docs.shipeasy.ai/get-started/install) — Project + first key
- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — Server vs client keys
- [Feature gates](https://docs.shipeasy.ai/flags/gates) — The rule model SDKs evaluate
- [Evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) — Why a flag resolved
