# Snippets

Source: https://docs.shipeasy.ai/sdks/reference/go/snippets

> Minimal copy-paste blocks for flags, configs, kill switches and metric tracking.

Minimal copy-paste blocks, grouped by the registry taxonomy. These are the same leaves the `docs get` op returns.

## release

### release / flags

Read the `new_checkout` gate for the bound user. Assumes `Configure()` ran at startup — see Installation.

### Read a flag

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

// GetFlag(name) — name is the gate key; returns false if the gate is
// absent, disabled, or killswitched (never a user argument — it's bound).
if c.GetFlag("new_checkout") {
    // new behaviour
}
```

### Flag with an explicit fallback

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

// GetFlagOr(name, def) — def is returned ONLY when the flag can't be
// evaluated (engine not ready, or the gate is absent); a gate that
// evaluates false returns false.
on := c.GetFlagOr("new_checkout", true) // name; def returned only on can't-evaluate
_ = on
```

### release / configs

Read the `billing_copy` dynamic config (typed JSON value). Assumes `Configure()` ran at startup — see Installation.

### Read a config

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

// GetConfig(name) — name is the config key; returns (value any, ok bool).
// ok is false when the key is absent. Type-assert value to what you stored.
if cfg, ok := c.GetConfig("billing_copy"); ok {
    m := cfg.(map[string]any) // configs are arbitrary JSON
    _ = m["cta"]
}
```

### Config with an explicit fallback

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

// GetConfigOr(name, def) — def is returned when the key is absent.
v := c.GetConfigOr("billing_copy", map[string]any{"cta": "Buy"}) // name; def
_ = v
```

### release / killswitches

Check whether the `payments` kill switch is engaged. Assumes `Configure()` ran at startup — see Installation.

### Read a kill switch

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

// GetKillswitch(name) — name is the kill-switch key; true means engaged
// (the feature is killed). Returns false if the switch is absent.
if c.GetKillswitch("payments") {
    // feature is killed — short-circuit
}
```

### Read a named per-key switch

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

// GetKillswitch(name, switchKey) — the optional switchKey selects a named
// per-key override (the dashboard "switches" feature). When that key has no
// override, it falls back to the kill switch's top-level value.
if c.GetKillswitch("payments", "eu") {
    // killed for the "eu" variant
}
```

## metrics

### metrics / track

Track a metric/conversion event from the bound `Client`. Metrics in the dashboard
are computed from these events. Assumes `Configure()` ran at startup — see
Installation.

### Track an event

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

// Track(event, props)
//   event — the event your metric is built on (required)
//   props — optional payload; numeric/string fields you can sum/filter on in a
//           metric (private attributes are stripped before egress)
c.Track("checkout_started", map[string]any{"amount": 49, "currency": "usd"})
```

Fire-and-forget (never blocks your response) and a no-op under
`ConfigureForTesting` / `ConfigureForOffline`. The unit is the bound user
(`user_id`, else `anonymous_id`); with no unit the call is a no-op.

### Track without properties

```go
// construct once per callsite (cheap; binds the user)
c := shipeasy.NewClient(shipeasy.User{"user_id": "u_123"})

c.Track("checkout_started", nil) // props are optional — pass nil
```

## ops

### ops / see

Report a caught, handled error (or a non-exception "violation") to Shipeasy with
`See()` — fire-and-forget, never panics into the request path. Package-level, so
it reports against the configuration from `Configure`. Assumes `Configure()` ran
at startup — see Installation.

### Report a handled error

```go
if err := charge(order); err != nil {
    // CausesThe(subject) — what the error affects (e.g. "checkout")
    // To(outcome)        — the terminal: what you do about it; builds + fires once
    shipeasy.See(err).CausesThe("checkout").To("use the backup processor")
    fallbackCharge(order)
}
```

### Attach context inline on `.To(outcome, extras)`

```go
if err := charge(order); err != nil {
    // .To(outcome, extras) — PREFERRED. The extras map is merged like a final
    // .Extras() call (later map wins). Structured fields are sanitized
    // (string/number/bool only; private attributes stripped before egress).
    // The consequence sentence stays whole and there is no ordering to remember.
    shipeasy.See(err).
        CausesThe("checkout").
        To("use cached prices", map[string]any{"order_id": order.ID})
}
```

`.To` returns nothing, so extras cannot trail the terminal in Go — the inline
form above is how you attach them. And never wedge `.Extras(...)` between
`.CausesThe` and `.To`: it splits the consequence sentence in half and is hard
to read.

```go
// NEVER — the subject and the outcome must stay adjacent:
// shipeasy.See(err).CausesThe("checkout").Extras(m).To("use cached prices")
```

### Report a non-exception violation

```go
// A bad state that isn't an error — the name is a STABLE fingerprint; put
// variable data in .Extras, never the name. .To() is the terminal.
shipeasy.SeeViolation("missing_invoice").
    CausesThe("billing").
    To("skip the dunning email")
```

### Mark an expected error — report NOTHING

```go
if errors.Is(err, sql.ErrNoRows) {
    // transmits nothing; .Because(...) / .Extras() are local-debug only
    shipeasy.ControlFlowException(err).Because("a missing row is the empty-state path")
}
```
