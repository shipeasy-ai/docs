# Snippets

Source: https://docs.shipeasy.ai/sdks/reference/kotlin/snippets

> Minimal copy-paste blocks for flags, configs, kill switches and metric tracking.

Minimal copy-paste blocks, grouped by the registry taxonomy. These are the same leaves the `docs get` op returns.

## release

### release / flags

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

### release / configs

Read a dynamic config value, with a default when the key is absent. Assumes
`configure()` ran at startup — see [Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation).

```kotlin
import ai.shipeasy.Client

// construct once per callsite (cheap; binds the user)
val flags = Client(currentUser)

// getConfig(name, default = null): default is returned when the key is absent.
val value = flags.getConfig("billing_copy", default = "Pay now")
```

### release / killswitches

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

## metrics

### metrics / track

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

## ops

### ops / see

Report a caught, handled error (or a non-exception "violation") to Shipeasy with
`see()` — fire-and-forget, never re-throws. Package-level, so it reports against
the SDK configured by `configure()`. Assumes `configure()` ran at startup — see
[Installation](https://docs.shipeasy.ai/sdks/reference/kotlin/installation).

### Report a handled exception

```kotlin
import ai.shipeasy.see

try {
    charge(order)
} catch (e: Exception) {
    // .causesThe(subject)   what the error affects (e.g. "checkout")
    // .to(outcome)          the terminal — what you do about it; builds + fires once
    see(e).causesThe("checkout").to("use the backup processor")
    fallbackCharge(order)
}
```

### Attach context inline on `.to(outcome, map)`

```kotlin
import ai.shipeasy.see

try {
    charge(order)
} catch (e: Exception) {
    // .to(outcome, map)     PREFERRED: terminal + extras in one call. Structured
    //                       fields are sanitized (String / finite Number /
    //                       Boolean only; capped at 20 keys). The consequence
    //                       sentence stays whole and there is no ordering to
    //                       remember.
    see(e).causesThe("checkout").to("use cached prices", mapOf("order_id" to oid))
}
```

`.to` returns `Unit`, so extras cannot trail the terminal in Kotlin — the
inline form above is how you attach them. And never wedge `.extras(...)`
between `.causesThe` and `.to`: it splits the consequence sentence in half and
is hard to read.

```kotlin
// NEVER — the subject and the outcome must stay adjacent:
// see(e).causesThe("checkout").extras(mapOf("order_id" to oid)).to("use cached prices")
```

### Report a non-exception violation

```kotlin
import ai.shipeasy.seeViolation

// a bad state that isn't an exception — the name is a STABLE fingerprint; put
// variable data in .extras, never the name. .to() is the terminal.
seeViolation("missing_invoice").causesThe("billing").to("skip the dunning email")
```

### Mark an expected exception — report NOTHING

```kotlin
import ai.shipeasy.controlFlowException

try {
    parse(token)
} catch (e: NoSuchElementException) {
    // transmits nothing; .because(...) / .extras() are local-debug only
    controlFlowException(e).because("end of stream is expected")
}
```
