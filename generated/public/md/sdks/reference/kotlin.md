# Overview

Source: https://docs.shipeasy.ai/sdks/reference/kotlin

> shipeasy-kotlin (ai.shipeasy:shipeasy-kotlin) is the server-side Shipeasy SDK for the JVM (and Android-compatible). It evaluates feature flags (gates),…

> **Note**
Generated from the SDK's own `/docs/` — also served raw at [`https://shipeasy-ai.github.io/sdk-kotlin/pages/overview.md`](https://shipeasy-ai.github.io/sdk-kotlin/pages/overview.md).

`shipeasy-kotlin` (`ai.shipeasy:shipeasy-kotlin`) is the **server-side** Shipeasy
SDK for the JVM (and Android-compatible). It evaluates feature flags (gates),
dynamic configs, kill switches and A/B experiments **locally** against rule blobs
it fetches from the Shipeasy edge — no per-evaluation network call on the hot
path.

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
