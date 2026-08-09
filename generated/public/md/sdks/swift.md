# Swift

Source: https://docs.shipeasy.ai/sdks/swift

> The Shipeasy Swift SDK — a native client SDK on SwiftPM, authenticating with the public client key, for flags, configs, kill switches, and metric tracking.

> **Note**
Generated from the Swift SDK repo's own `/docs/` — the same Markdown `shipeasy docs get --sdk swift overview` returns, served raw at [`https://shipeasy-ai.github.io/sdk-swift/pages/overview.md`](https://shipeasy-ai.github.io/sdk-swift/pages/overview.md). Edit it in the SDK repo, not here.

`Shipeasy` is the **native client** Swift SDK for [Shipeasy](https://shipeasy.ai) —
feature flags, dynamic configs, kill switches, and A/B experiments for an
iOS / macOS / tvOS / watchOS app. It uses a **public client key** (`pk_…`, safe
to embed in a shipped app), evaluates one device user server-side over
`POST /sdk/evaluate`, and serves cheap local reads from the cached response.

## Install

```bash
.package(url: "https://github.com/shipeasy-ai/sdk-swift.git", from: "3.0.0")
```

Full wiring — frameworks, options, env vars — is in [Installation](https://docs.shipeasy.ai/sdks/reference/swift/installation).

## Mental model: `configureClient()` once, then `identify` + read

You call `configureClient(clientKey:)` **once** at app launch. It returns a
`ShipeasyClient` and registers it as the process-global one (fetch it later with
`shipeasyClient()`). Then you `identify(...)` the device user (which evaluates and
caches assignments) and read flags/configs/experiments from the cache:

```swift
import Shipeasy

// Once, at app launch — PUBLIC client key (pk_…), safe to embed:
let client = configureClient(clientKey: "pk_live_…")

// Bind the user (pass [:] for a logged-out visitor). Awaiting the first identify
// guarantees the first reads see assignments:
await client.identify(["user_id": "u_123", "plan": "pro"])

// Reads serve the cached /sdk/evaluate response (no per-call network):
let enabled = await client.getFlag("new_checkout")
```

`ShipeasyClient` is a Swift `actor`, so its methods are `async` — you `await`
them. Reads are served from a **local cache** of the last `/sdk/evaluate`
response, so they never hit the network and are safe from any thread. Before the
first `identify`, reads return the supplied defaults.

The **persisted device `anonymous_id`** is the whole point of the client SDK: it
survives cold starts so a logged-out visitor buckets identically into every
fractional rollout and experiment on every launch. See
[configuration](https://docs.shipeasy.ai/sdks/reference/swift/configuration) and [advanced](https://docs.shipeasy.ai/sdks/reference/swift/advanced#anonymous-id-persistence--anonymousstore).

## The things you use

| Function / type            | Role |
| -------------------------- | ---- |
| `configureClient(...)`     | Called **once** at app launch. Wires the client key, HTTP, and the anon-id store; returns the `ShipeasyClient` and registers it globally. First-config-wins (idempotent). See [configuration](https://docs.shipeasy.ai/sdks/reference/swift/configuration). |
| `shipeasyClient()`         | Fetch the configured client (`ShipeasyClient?`), or `nil` if `configureClient` hasn't run. |
| `client.identify(_:)`      | Bind the device user + refresh assignments over `/sdk/evaluate`. Call at launch, on login, and whenever targeting attributes change. |
| `client.reset()`           | Logout: clear `user_id`, keep the device `anonymous_id`, re-evaluate as anonymous. |
| `client.getFlag/getConfig/getKillswitch` | Cached reads for the current user. |
| `client.universe(_:).assign()` | Assign the user within a universe (a mutual-exclusion pool — the user lands in at most one of its experiments) and read the resolved params. Auto-logs one exposure when enrolled. |
| `client.track(_:properties:)` | Conversion telemetry (fire-and-forget). |
| `see(_:)` family           | Structured error reporting. See [error-reporting](https://docs.shipeasy.ai/sdks/reference/swift/error-reporting). |

## Pages

- [installation](https://docs.shipeasy.ai/sdks/reference/swift/installation) — SwiftPM dependency, platforms, where to call `configureClient`, and custom anon-id stores.
- [configuration](https://docs.shipeasy.ai/sdks/reference/swift/configuration) — `configureClient(...)`, every option, the persisted anon-id, `shipeasyClient()`.
- [flags](https://docs.shipeasy.ai/sdks/reference/swift/flags) — `getFlag`, defaults.
- [configs](https://docs.shipeasy.ai/sdks/reference/swift/configs) — `getConfig`, defaults, typed reads.
- [killswitches](https://docs.shipeasy.ai/sdks/reference/swift/killswitches) — `getKillswitch` + named override switches.
- [error-reporting](https://docs.shipeasy.ai/sdks/reference/swift/error-reporting) — `see()` structured error reporting.
- [testing](https://docs.shipeasy.ai/sdks/reference/swift/testing) — hermetic tests with an in-memory store + a stub transport.
- [openfeature](https://docs.shipeasy.ai/sdks/reference/swift/openfeature) — provider status (not shipped).
- [advanced](https://docs.shipeasy.ai/sdks/reference/swift/advanced) — private attributes, custom `AnonymousStore`, `anonymousId`, `refreshAssignments`.

The blocks below are the SDK repo's own snippets — the same ones `shipeasy docs get --sdk swift release/flags` returns, with a worked example baked in.

## Feature flags

Evaluate the feature gate `new_checkout` from the configured `ShipeasyClient`
(cached `/sdk/evaluate` read). Assumes `configureClient(...)` ran at startup — see
Installation.

```swift
// name; getFlag returns the default when assignments aren't loaded or the flag is absent
let enabled = await shipeasyClient()?.getFlag("new_checkout") ?? false

// optional `default:` — returned ONLY when the flag can't be evaluated
// (assignments not loaded / flag not found), never when it evaluates to false
let safe = await shipeasyClient()?.getFlag("new_checkout", default: false) ?? false
```

## Dynamic configs

Read the dynamic config `billing_copy` from the configured `ShipeasyClient`
(returns `Any?`). Assumes `configureClient(...)` ran at startup — see Installation.

```swift
// name; returns nil when the key is absent (or assignments aren't loaded)
let value = await shipeasyClient()?.getConfig("billing_copy")

// optional `default:` — returned when the config key is absent
let copy = await shipeasyClient()?.getConfig("billing_copy", default: ["headline": "Welcome"])

// the value is Any? — cast to the shape your config defines
let headline = (copy as? [String: Any])?["headline"] as? String
```

## Kill switches

Check whether the kill switch `payments` is engaged (`true` = killed)
from the configured `ShipeasyClient`. Assumes `configureClient(...)` ran at startup
— see Installation.

### Top-level switch

```swift
// name; getKillswitch returns true when the switch is on (the guarded path is killed)
let killed = await shipeasyClient()?.getKillswitch("payments") ?? false
```

### Named per-key override switch

```swift
// switchKey: read one named override (e.g. per region); an unset key falls back
// to the kill switch's top-level value
let killedEu = await shipeasyClient()?.getKillswitch("payments", switchKey: "eu_region") ?? false
```

## Track a conversion

Track a metric/conversion event from the configured `ShipeasyClient`. Metrics in
the dashboard are computed from these events. Assumes `configureClient(...)` ran at
startup — see Installation.

### Track an event

```swift
// track(event, properties:)
//   event       — the event your metric is built on (required)
//   properties: — optional payload; numeric/string fields you can sum/filter on
//                 in a metric (private attributes are stripped before egress)
await shipeasyClient()?.track("checkout_started", properties: ["amount": 49, "currency": "usd"])
```

Fire-and-forget (never blocks). The unit is the identified user (`user_id`, else
the persisted `anonymous_id`), attached automatically.

### Track without properties

```swift
await shipeasyClient()?.track("checkout_started")   // properties default to [:]
```

**Related**

- [Swift full reference](https://docs.shipeasy.ai/sdks/reference/swift) — Every feature page
- [Shared evaluation model](https://docs.shipeasy.ai/sdks) — How every SDK buckets
- [Testing](https://docs.shipeasy.ai/sdks/reference/swift/testing) — Seed values, zero network
- [Error reporting](https://docs.shipeasy.ai/sdks/reference/swift/error-reporting) — The see() surface
