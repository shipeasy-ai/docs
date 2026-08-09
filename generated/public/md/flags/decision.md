# Which primitive should I use?

Source: https://docs.shipeasy.ai/flags/decision

> Decision tree — map your goal to feature flags, configs, or killswitches.

You have a change to ship. Which Shipeasy primitive fits? Walk the tree.

## Cheat sheet

- **[Feature flag](https://docs.shipeasy.ai/flags/gates)** —
    *"Show v2 of checkout to 5% of EU users."* Boolean output. Targeting rules + rollout %.

- **[Config](https://docs.shipeasy.ai/flags/configs)** —
    *"Set the homepage hero copy to '...' in production, '...' in staging."* Typed value. Per-env
    drafts.

- **[Killswitch](https://docs.shipeasy.ai/flags/killswitches)** —
    *"Stop sending emails. Right now."* One bit, big red button. Auditable in the activity log.

## Common mistakes

> **Using a feature flag when you should be using a config**

If your code reads `if (gate) value = 'A' else value = 'B'`, you've smuggled a value through a
boolean. Use a **config** — schema-validated, typed, supports more than two values.

> **Reading a rollout percentage as a verdict**

A 50% rollout tells you who saw what, not whether it worked. If the question is "did this move
the number", define a [metric](https://docs.shipeasy.ai/metrics/quickstart) over your own events and watch it across the
ramp — the flag decides exposure, the metric decides whether you keep going.

> **Using a feature flag when you should be using a killswitch**

Page-at-3am feature flags blur incident response. Killswitches sit in their own list, default to
"on", and don't have ramp percentages to fat-finger.

**Related**

- [Feature flags](https://docs.shipeasy.ai/flags/gates) — Ramps, targeting, per-user overrides
- [Configs](https://docs.shipeasy.ai/flags/configs) — Typed values you change without a deploy
- [Killswitches](https://docs.shipeasy.ai/flags/killswitches) — One switch, one job, for incidents
- [Case studies](https://docs.shipeasy.ai/flags/case-studies) — The same choice, made in real scenarios
