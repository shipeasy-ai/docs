# Killswitches

Source: https://docs.shipeasy.ai/sdks/reference/kotlin/killswitches

> getKillswitch(name) returns a Boolean: true when the killswitch is killed (the feature should be turned OFF). Killswitches ride in the same flags blob as…

> **Note**
Generated from the SDK's own `/docs/` — also served raw at [`https://shipeasy-ai.github.io/sdk-kotlin/pages/killswitches.md`](https://shipeasy-ai.github.io/sdk-kotlin/pages/killswitches.md).

`getKillswitch(name)` returns a `Boolean`: `true` when the killswitch is
**killed** (the feature should be turned OFF). Killswitches ride in the same
flags blob as gates and configs.

## Bound `Client` form

```kotlin
val flags = Client(currentUser)

if (flags.getKillswitch("payments")) {
    // payments are killed — short-circuit
    return serviceUnavailable()
}
```

## Named per-switch override key

A killswitch can carry named per-key override **switches**. Pass `switchKey` to
read one specific named switch: `true` when that named override is on.

```kotlin
flags.getKillswitch("payments", switchKey = "eu_region")   // → Boolean
```

If the named switch key isn't configured for this killswitch, the read **falls
back to the killswitch's top-level value** (the plain `getKillswitch(name)`
result).

## Semantics

- Without `switchKey`: returns `true` when the whole killswitch is killed.
- With `switchKey`: returns `true` when that specific per-key override switch is on; an unconfigured key falls back to the top-level value.
- Unknown killswitches return `false`.
