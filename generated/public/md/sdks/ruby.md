# Ruby

Source: https://docs.shipeasy.ai/sdks/ruby

> The Shipeasy Ruby gem — fork-safe singleton, Rails railtie, local evaluation, configs, kill switches, and metric tracking.

> **Note**
Generated from the Ruby SDK repo's own `/docs/` — the same Markdown `shipeasy docs get --sdk ruby overview` returns, served raw at [`https://shipeasy-ai.github.io/sdk-ruby/pages/overview.md`](https://shipeasy-ai.github.io/sdk-ruby/pages/overview.md). Edit it in the SDK repo, not here.

`shipeasy-sdk` is the server-side Ruby gem for the [Shipeasy](https://shipeasy.ai)
hosted service: feature gates (flags), dynamic configs, kill switches, A/B
experiments, metric tracking, `see()` error reporting, and i18n view helpers for
Rails. It uses your **server key** and must never be embedded in a browser. It is
Rails-friendly but works in plain Ruby, Sinatra, Hanami, and serverless too.

## Install

```ruby
# Gemfile
gem "shipeasy-sdk"
```

Full wiring — frameworks, options, env vars — is in [Installation](https://docs.shipeasy.ai/sdks/reference/ruby/installation).

## Mental model: configure once, bind a `Client` per user

There are exactly two things to learn:

1. **`Shipeasy.configure { |c| ... }`** — call it **once** at boot with your
   server key and an optional `attributes` transform (your user object → the
   Shipeasy attribute hash). This is the whole setup story.
2. **`Shipeasy::Client.new(user)`** — construct a cheap, **user-bound** handle per
   request and read with **no user argument** (the user is bound at construction).

```ruby
# boot (config/initializers/shipeasy.rb)
Shipeasy.configure do |c|
  c.api_key    = ENV.fetch("SHIPEASY_SERVER_KEY")
  c.attributes = ->(u) { { "user_id" => u.id, "plan" => u.plan } }
end

# per request — construct once per callsite (cheap; binds the user)
flags = Shipeasy::Client.new(current_user)

flags.get_flag("new_checkout")                       # NO user arg — bound at construction
flags.get_config("button_color")
assignment = flags.universe("checkout").assign       # <=1 experiment; auto-logs exposure
assignment.get("label", "Buy")                       # variant ?? universe default ?? fallback
flags.track("purchase", { revenue: 49 })             # on conversion
flags.get_killswitch("payments")
```

## What the bound `Client` does

Everything you need per request is on `Shipeasy::Client.new(user)` — no user
argument on any call:

- `get_flag(name, default: false)` · `get_flag_detail(name)`
- `get_config(name, decode = nil, default: nil)`
- `get_killswitch(name, switch_key = nil)`
- `universe(name).assign` → an `Assignment` (`.name` / `.group` / `.enrolled?` / `.get(field, fallback = nil)`); auto-logs one deduped exposure when enrolled
- `track(event_name, props = {})`

So an experiment is **end-to-end Client-only**. Constructing a
`Shipeasy::Client.new(user)` before `Shipeasy.configure` raises `Shipeasy::Error`.

## The configure family

| call | when |
| --- | --- |
| [`Shipeasy.configure { ... }`](https://docs.shipeasy.ai/sdks/reference/ruby/configuration) | production — your server key |
| [`Shipeasy.configure_for_testing(...)`](https://docs.shipeasy.ai/sdks/reference/ruby/testing) | unit tests — no network, seed overrides |
| [`Shipeasy.configure_for_offline(...)`](https://docs.shipeasy.ai/sdks/reference/ruby/testing) | evaluate real rules from a snapshot / file |

After any of them, you read the same way: `Shipeasy::Client.new(user)`.

## Pages

- [installation](https://docs.shipeasy.ai/sdks/reference/ruby/installation) — gem, frameworks (Rails / Sinatra / serverless), `configure`
- [configuration](https://docs.shipeasy.ai/sdks/reference/ruby/configuration) — `Shipeasy.configure`, keys, attributes, one-shot vs poll, options
- [flags](https://docs.shipeasy.ai/sdks/reference/ruby/flags) — `get_flag` + `get_flag_detail`
- [configs](https://docs.shipeasy.ai/sdks/reference/ruby/configs) — `get_config`
- [killswitches](https://docs.shipeasy.ai/sdks/reference/ruby/killswitches) — `get_killswitch`, named switches
- [error-reporting](https://docs.shipeasy.ai/sdks/reference/ruby/error-reporting) — `see()` structured reporting
- [testing](https://docs.shipeasy.ai/sdks/reference/ruby/testing) — `configure_for_testing`, `configure_for_offline`, overrides
- [openfeature](https://docs.shipeasy.ai/sdks/reference/ruby/openfeature) — `Shipeasy::OpenFeature::Provider`
- [advanced](https://docs.shipeasy.ai/sdks/reference/ruby/advanced) — anon-id middleware, private attributes, sticky bucketing, manual exposure, SSR

The blocks below are the SDK repo's own snippets — the same ones `shipeasy docs get --sdk ruby release/flags` returns, with a worked example baked in.

## Feature flags

Evaluate the feature gate `new_checkout` on a user-bound Client. Assumes
`Shipeasy.configure` ran at startup — see Installation.

### Basic check

```ruby
# construct once per callsite (cheap; binds the user + runs the attributes transform)
flags = Shipeasy::Client.new(current_user)

# get_flag(name, default: false)
#   name    — the gate key (required)
#   default — returned ONLY when the value can't be resolved (client not ready /
#             gate absent); a gate that evaluates to false returns false
if flags.get_flag("new_checkout", default: false)
  # ship it
end
```

### Why it resolved that way — `get_flag_detail`

```ruby
flags = Shipeasy::Client.new(current_user)

# returns a FlagDetail (.value, .reason); reason ∈ RULE_MATCH / DEFAULT / OFF /
# OVERRIDE / FLAG_NOT_FOUND / CLIENT_NOT_READY
detail = flags.get_flag_detail("new_checkout")
logger.info("flag=new_checkout value=#{detail.value} reason=#{detail.reason}")
```

### React to flag changes (long-running server)

```ruby
# requires configure(poll: true); fires after a poll fetches NEW data (200, not 304)
unsubscribe = Shipeasy.on_change { reload_local_cache! }
# ... later: unsubscribe.call
```

## Dynamic configs

Read the dynamic config `billing_copy` with a fallback default.

> Assumes `Shipeasy.configure` ran at startup — see Installation.

```ruby
# construct once per callsite (cheap; binds the user)
flags = Shipeasy::Client.new(current_user)

# get_config(name, decode = nil, default: nil)
#   name    — the config key
#   decode  — optional proc run on a present value, e.g. ->(v) { v["max"] }
#   default — returned only when the config key is absent
value = flags.get_config("billing_copy", default: "blue")
```

## Kill switches

Read the kill switch `payments` (true = killed). Assumes
`Shipeasy.configure` ran at startup — see Installation.

### Whole switch

```ruby
# construct once per callsite (cheap; binds the user)
flags = Shipeasy::Client.new(current_user)

# get_killswitch(name, switch_key = nil)
#   name       — the kill switch key (required)
#   switch_key — optional named per-key switch to read
if flags.get_killswitch("payments")
  # killed → take the safe path
end
```

### A named per-key switch

```ruby
flags = Shipeasy::Client.new(current_user)

provider = "stripe"   # pass the thing you're about to do as the switch key

# A configured switch returns its own boolean; an unconfigured key falls back to
# the kill switch's top-level value.
if flags.get_killswitch("payments", provider)
  use_backup_processor
end
```

## Track a conversion

Track a metric/conversion event from the bound Client. Metrics in the dashboard
are computed from these events. Assumes `Shipeasy.configure` ran at startup —
see Installation.

### Track an event

```ruby
# construct once per callsite (cheap; binds the user)
flags = Shipeasy::Client.new(current_user)

# track(event_name, props = {})
#   event_name — the event your metric is built on (required)
#   props      — optional payload; numeric/string fields you can sum/filter on
#                in a metric (private attributes are stripped before egress)
flags.track("checkout_started", { amount: 49, currency: "usd" })
```

Fire-and-forget (never blocks your response) and a no-op under
`configure_for_testing` / `configure_for_offline`. The unit is the bound user
(`user_id`, else `anonymous_id`); with no unit the call is a no-op.

### Track without properties

```ruby
flags = Shipeasy::Client.new(current_user)

flags.track("checkout_started")   # props are optional
```

**Related**

- [Ruby full reference](https://docs.shipeasy.ai/sdks/reference/ruby) — Every feature page
- [Shared evaluation model](https://docs.shipeasy.ai/sdks) — How every SDK buckets
- [Testing](https://docs.shipeasy.ai/sdks/reference/ruby/testing) — Seed values, zero network
- [Error reporting](https://docs.shipeasy.ai/sdks/reference/ruby/error-reporting) — The see() surface
