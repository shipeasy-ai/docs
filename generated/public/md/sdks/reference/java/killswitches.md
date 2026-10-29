# Killswitches

Source: https://docs.shipeasy.ai/sdks/reference/java/killswitches

> getKillswitch reads an operational killswitch from the cached rules blob. A killswitch is the panic lever: true means \"killed\" (the protected path should be…

> **Note**
Generated from the SDK's own `/docs/` — also served raw at [`https://shipeasy-ai.github.io/sdk-java/pages/killswitches.md`](https://shipeasy-ai.github.io/sdk-java/pages/killswitches.md).

`getKillswitch` reads an operational killswitch from the cached rules blob.
A killswitch is the panic lever: `true` means "killed" (the protected path
should be disabled).

## Whole killswitch

```java
import ai.shipeasy.Client;
import java.util.Map;

Client c = new Client(Map.of("user_id", "u_123"));
boolean killed = c.getKillswitch("panic_button");
if (killed) {
    // disable the protected path
}
```

`getKillswitch(name)` returns `true` when the whole killswitch is killed.
Unknown killswitches return `false`.

## Named per-key switches

A killswitch can carry named per-key switches. Pass the switch key to read one:

```java
boolean checkoutOff = c.getKillswitch("panic_button", "checkout");
```

With `switchKey`, the call returns `true` when that specific named switch is on.
An **unconfigured** switch key falls back to the killswitch's top-level value,
so a switch you haven't explicitly set tracks whether the whole killswitch is
killed. A `null` `switchKey` reads the whole-kill-switch killed state directly.

Killswitches are not user-scoped — the bound user is irrelevant to the result,
but reading them off the same `Client` keeps everything one-stop.
