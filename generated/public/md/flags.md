# Flags & Configs

Source: https://docs.shipeasy.ai/flags

> One product, three primitives. Pick the right one for the change you're shipping.

Three primitives that share one SDK and one API key: feature flags for targeted ramps, configs for typed values you change without a deploy, killswitches for break-glass.

## Three primitives, one mental model

- **[Feature flags — boolean flags](https://docs.shipeasy.ai/flags/gates)** — Targeted rollouts: enable for `country=US`, ramp `5% → 100%`. The default tool when you want to ship code without showing it to everyone.

- **[Configs — typed values](https://docs.shipeasy.ai/flags/configs)** — String, number, boolean, JSON values you change without a redeploy. Use when the question is
    *"what value?"* not *"on or off?"*.

- **[Killswitches — break-glass](https://docs.shipeasy.ai/flags/killswitches)** — A flag with a single job: disable a system in an incident. Separate from feature flags so on-call doesn't have to think about rollout percentages at 3am.

> **Not sure which to use?**

See the [decision tree](https://docs.shipeasy.ai/flags/decision) — one diagram that maps "I want to do X" to the right
primitive.

## How it works

Every primitive is read by your SDK with sub-millisecond latency — no round-trip on the hot path.
Writes you make in the dashboard or CLI propagate worldwide in under a second.

- **[Install & configure](https://docs.shipeasy.ai/flags/getting-started)** — `npm install @shipeasy/sdk` and one `configure()` call.

- **[Ship your first feature flag](https://docs.shipeasy.ai/flags/gates/quickstart)** — Five-minute walkthrough. Create, put a feature flag around your code, ramp.

- **[Measure what it did](https://docs.shipeasy.ai/metrics/quickstart)** — Turn your own events into a metric and watch it while the ramp climbs.
