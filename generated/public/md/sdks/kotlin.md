# Kotlin

Source: https://docs.shipeasy.ai/sdks/kotlin

> The Shipeasy Kotlin SDK — pure-JVM core plus an Android client artifact, local evaluation, configs, kill switches, and metric tracking.

> **Note**
Generated from the Kotlin SDK repo's own `/docs/` — the same Markdown `shipeasy docs get --sdk kotlin overview` returns, served raw at [`https://shipeasy-ai.github.io/sdk-kotlin`](https://shipeasy-ai.github.io/sdk-kotlin). Edit it in the SDK repo, not here.

`shipeasy-kotlin` (`ai.shipeasy:shipeasy-kotlin`) is the **server-side** Shipeasy
SDK for the JVM (and Android-compatible). It evaluates feature flags (gates),
dynamic configs, kill switches and A/B experiments **locally** against rule blobs
it fetches from the Shipeasy edge — no per-evaluation network call on the hot
path.

## Install

```kotlin
implementation("ai.shipeasy:shipeasy-kotlin:0.10.0")
```

Full wiring — frameworks, options, env vars — is in [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation).

## Mental model: `configure()` once, then `Client(user)`

```kotlin
import ai.shipeasy.configure
import ai.shipeasy.Client

// Once, at app boot.
configure(apiKey = System.getenv("SHIPEASY_SERVER_KEY"))

// Per request — cheap, no own connection/poll.
val flags = Client(currentUser)
flags.getFlag("new_checkout")        // → Boolean (no user arg; user bound at construction)
```

You learn exactly two things:

1. **`configure()`** (and its test/offline siblings `configureForTesting()` /
   `configureForOffline()`) — call it once at app boot.
2. **`Client(user)`** — the cheap, user-bound handle for every read:
   `getFlag` / `getFlagDetail` / `getConfig` / `getKillswitch` /
   `universe(name).assign()` / `track`.

The user (and the `attributes` transform you register at configure time) is bound
when you construct the `Client`, so its methods take no user argument. Construct a
`Client` per request/user — it is cheap and opens no connection, fetch, or poll of
its own.

A handful of top-level package functions cover everything else without naming a
heavyweight object: `overrideFlag` / `overrideConfig` / `overrideExperiment` /
`clearOverrides`, `onChange`, `bootstrapScriptTag` / `i18nScriptTag` /
`devtoolsScriptTag`, and the
`see()` family.

## Shipping in an Android app? Use `ShipeasyClient`

`configure()` / `Client(user)` above is the **server** SDK — it holds a server
key and evaluates rules locally. **Never embed a server key in a shipped app.**
For an Android app, use `configureAndroid(context, clientKey)` +
`ShipeasyClient`: a **public client key**, server-side evaluation over
`POST /sdk/evaluate`, and a **persisted device `anonymous_id`** so logged-out
users bucket identically across launches. It ships in the companion artifact
`ai.shipeasy:shipeasy-kotlin-android`; the core jar stays pure-JVM (Ktor / Spring
/ http4k servers are unaffected). See [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation#native-mobile-client--android-shipeasyclient).

## Feature reference

- [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation) — Gradle/Maven dependency, runtime, imports, and the canonical `configure()` reference.
- [Configuration](https://docs.shipeasy.ai/sdks/reference/kotlin/configuration) — `configure()` in full, the `attributes` transform, init/poll.
- [Flags](https://docs.shipeasy.ai/sdks/reference/kotlin/flags) — `getFlag` / `getFlagDetail`.
- [Configs](https://docs.shipeasy.ai/sdks/reference/kotlin/configs) — `getConfig`.
- [Kill switches](https://docs.shipeasy.ai/sdks/reference/kotlin/killswitches) — `getKillswitch`.
- [Error reporting](https://docs.shipeasy.ai/sdks/reference/kotlin/error-reporting) — `see()` structured error reporting.
- [Testing](https://docs.shipeasy.ai/sdks/reference/kotlin/testing) — `configureForTesting()` / `configureForOffline()` + the override helpers.
- [OpenFeature](https://docs.shipeasy.ai/sdks/reference/kotlin/openfeature) — provider availability.
- [Advanced](https://docs.shipeasy.ai/sdks/reference/kotlin/advanced) — private attributes, sticky bucketing, anon-id, manual exposure, SSR.

The blocks below are the SDK repo's own snippets — the same ones `shipeasy docs get --sdk kotlin release/flags` returns, with a worked example baked in.

## Feature flags

Read a feature gate with a bound `Client`. Assumes `configure()` ran at startup
— see [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation).

```kotlin
import ai.shipeasy.Client

// construct once per callsite (cheap; binds the user, no own connection/poll)
val flags = Client(currentUser)

// getFlag(name, default = false): default is returned ONLY when the gate can't
// be evaluated (SDK not ready / flag unknown) — never for a real `false`.
if (flags.getFlag("new_checkout", default = false)) {
    // gate is on for this user
}
```

## Dynamic configs

Read a dynamic config value, with a default when the key is absent. Assumes
`configure()` ran at startup — see [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation).

```kotlin
import ai.shipeasy.Client

// construct once per callsite (cheap; binds the user)
val flags = Client(currentUser)

// getConfig(name, default = null): default is returned when the key is absent.
val value = flags.getConfig("billing_copy", default = "Pay now")
```

## Kill switches

Check a kill switch — `true` means the feature is killed. Assumes `configure()`
ran at startup — see [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation).

```kotlin
import ai.shipeasy.Client

// construct once per callsite (cheap; binds the user)
val flags = Client(currentUser)

// getKillswitch(name, switchKey = null): without switchKey → true when the whole
// kill switch is killed; with switchKey → true when that named per-key override
// is on (an unconfigured key falls back to the top-level value).
if (flags.getKillswitch("payments", switchKey = null)) {
    return serviceUnavailable()   // killed — short-circuit
}
```

## Track a conversion

Track a metric/conversion event from the bound `Client`. Metrics in the
dashboard are computed from these events. Assumes `configure()` ran at startup —
see [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation).

### Track an event

```kotlin
import ai.shipeasy.Client

// construct once per callsite (cheap; binds the user)
val flags = Client(currentUser)

// track(event, props = emptyMap())
//   event — the event your metric is built on (required)
//   props — optional payload; numeric/string fields you can sum/filter on in a
//           metric (private attributes are stripped before egress)
flags.track("checkout_started", mapOf("amount" to 49, "currency" to "usd"))
```

Fire-and-forget (never blocks your response) and a no-op under
`configureForTesting` / `configureForOffline`. The unit is the bound user
(`user_id`, else `anonymous_id`); with no unit the call is a no-op.

### Track without properties

```kotlin
import ai.shipeasy.Client

// construct once per callsite (cheap; binds the user)
val flags = Client(currentUser)

flags.track("checkout_started")   // props are optional (default emptyMap())
```

**Related**

- [Kotlin full reference](https://docs.shipeasy.ai/sdks/reference/kotlin) — Every feature page
- [Shared evaluation model](https://docs.shipeasy.ai/sdks) — How every SDK buckets
- [Testing](https://docs.shipeasy.ai/sdks/reference/kotlin/testing) — Seed values, zero network
- [Error reporting](https://docs.shipeasy.ai/sdks/reference/kotlin/error-reporting) — The see() surface
