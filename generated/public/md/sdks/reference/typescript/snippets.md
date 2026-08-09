# Snippets

Source: https://docs.shipeasy.ai/sdks/reference/typescript/snippets

> Minimal copy-paste blocks for flags, configs, kill switches and metric tracking.

Minimal copy-paste blocks, grouped by the registry taxonomy. These are the same leaves the `docs get` op returns.

## release

### release / flags

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

### release / configs

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

### release / killswitches

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

## metrics

### metrics / track

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

## ops

### ops / see

Report a caught, handled error (or a non-exception "violation") to Shipeasy with
`see()` — fire-and-forget, never re-throws. Package-level, so it reports against
the configuration from `configure()`. Assumes `configure()` ran at startup — see
Installation.

### Report a handled exception

```ts
import { see } from "@shipeasy/sdk/server"; // or "@shipeasy/sdk/client"

try {
  await charge(order);
} catch (e) {
  // .causes_the(subject)   what the error affects (e.g. "checkout")
  // .to(outcome)           the terminal — what you do about it; builds + fires once
  see(e).causes_the("checkout").to("use the backup processor");
  await fallbackCharge(order);
}
```

### Attach context with `.extras(...)`

```ts
try {
  await charge(order);
} catch (e) {
  // .extras(obj)           structured fields attached to the report. PREFERRED:
  //                        chain it AFTER the terminal, so the consequence
  //                        sentence stays whole and extras hang off the end.
  //                        (The chain dispatches on the next microtask, so a
  //                        post-.to .extras is still folded into the report.)
  see(e).causes_the("checkout").to("use cached prices").extras({ order_id: order.id });

  // Also fine — extras folded into the terminal inline:
  see(e).causes_the("checkout").to("use cached prices", { order_id: order.id });

  // NEVER: extras wedged between the subject and the outcome — it splits the
  // consequence sentence in half and is hard to read.
  // see(e).causes_the("checkout").extras({ order_id: order.id }).to("use cached prices");
}
```

### Attach context from anywhere with `addExtras(...)`

```ts
import { see, addExtras, clearExtras, runWithExtras } from "@shipeasy/sdk/server";
// or: import { see, addExtras, clearExtras } from "@shipeasy/sdk/client";

// Buffer extras earlier — from any layer, not just the catch. Every see() report
// that fires LATER in the same scope carries them, so you don't thread context
// down into the catch site. A chained .extras / .to extra of the same key wins.
runWithExtras(async () => {          // server: per-request AsyncLocalStorage scope
  addExtras({ order_id: order.id, tenant: tenant.slug });

  // ...deep in a service, later in the same request...
  try {
    await charge(order);
  } catch (e) {
    // report carries order_id + tenant automatically
    see(e).causes_the("checkout").to("use cached prices");
  }
});
// In the browser there is one user per page — call addExtras() directly (no
// runWithExtras) and clearExtras() on a route change.
```

### Report a non-exception violation

```ts
// A bad state that isn't an exception — the name is a STABLE fingerprint; put
// variable data in .extras, never the name. .to() is the terminal.
see.Violation("missing_invoice").causes_the("billing").to("skip the dunning email");
```

### Mark an expected exception — report NOTHING

```ts
try {
  parse(token);
} catch (e) {
  // transmits nothing; .because(...) / .extras() are local-debug only
  see.ControlFlowException(e).because("because end of stream is expected");
}
```
