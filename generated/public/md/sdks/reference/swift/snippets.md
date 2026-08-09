# Snippets

Source: https://docs.shipeasy.ai/sdks/reference/swift/snippets

> Minimal copy-paste blocks for flags, configs, kill switches and metric tracking.

Minimal copy-paste blocks, grouped by the registry taxonomy. These are the same leaves the `docs get` op returns.

## release

### release / flags

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

### release / configs

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

### release / killswitches

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

## metrics

### metrics / track

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

## ops

### ops / see

Report a caught, handled error (or a non-exception "violation") to Shipeasy with
`see()` — fire-and-forget, never re-throws, tagged with the side `"client"`.
Package-level, so it reports against the client from `configureClient(...)`. Assumes
`configureClient(...)` ran at startup — see Installation.

### Report a handled exception

```swift
do {
    try charge(order)
} catch {
    // .causesThe(subject)   what the error affects (e.g. "checkout")
    // .to(outcome)          the terminal — what you do about it; builds + fires once
    see(error).causesThe("checkout").to("use cached prices")
    try? fallbackCharge(order)
}
```

### Attach context inline on `.to(_:extras:)`

```swift
do {
    try charge(order)
} catch {
    // .to(outcome, extras:) PREFERRED: terminal + extras in one call (private
    //                       attributes are stripped before egress). The
    //                       consequence sentence stays whole and there is no
    //                       ordering to remember.
    see(error).causesThe("checkout").to("use cached prices", extras: ["order_id": orderId])

    // .to returns Void, so extras cannot trail the terminal in Swift.

    // NEVER: extras wedged between the subject and the outcome — it splits the
    // consequence sentence in half and is hard to read.
    // see(error).causesThe("checkout").extras(["order_id": orderId]).to("use cached prices")
}
```

### Report a non-exception violation

```swift
// a bad state that isn't an exception — the name is a STABLE fingerprint; put
// variable data in .extras, never the name. .to() is the terminal.
seeViolation("large query").causesThe("search results").to("be trimmed")
```

### Mark an expected exception — report NOTHING

```swift
do {
    try parse(token)
} catch {
    // transmits nothing; .because(...) / .extras() are local-debug only
    controlFlowException(error).because("end of stream is expected")
}
```
