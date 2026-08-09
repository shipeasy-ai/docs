# Configs — typed values

Source: https://docs.shipeasy.ai/flags/configs

> Typed config values you can change without a redeploy.

Typed key/value configs (string, number, boolean, JSON) you can change without shipping code. Schema-validated. Sub-millisecond evaluation in your SDK with no per-request fetch.

A **config** is a typed key/value you can change without a redeploy. Use one when the answer to
_"what should this be right now?"_ is not boolean — pricing, copy, limits, feature options,
endpoint paths, model names, anything you'd otherwise hard-code as a constant.

## When to use a config [#when-to-use]

- **[Typed values](#values)** — `string`, `number`, `boolean`, or `json`. Schema-validated when you create the config and again every time you change it.

- **[Typed access in your code](#access)** — `await config<number>('home.hero.duration')` returns a typed value with the right TS type, not `unknown`.

- **[Fail-safe defaults](#fallback)** — Configs return last-known-good if our service is unreachable. Override with `defaultValue` per call when "off" is the dangerous answer.

- **[Audit log](#audit)** — Every change records who, what, and when. Linkable in your incident timeline.

## Reading a config

```ts
import { config } from "@shipeasy/sdk/server";

const heroTitle = await config<string>("home.hero.title");
const promoActive = await config<boolean>("promo.active");
const limits = await config<{ maxItems: number; maxPrice: number }>("checkout.limits");
```

Sub-millisecond evaluation — no per-request fetch from your code.

## Configs vs feature flags

Both are typed values you can change without a redeploy. Pick by the **shape of the answer**:

| Question            | Feature flag       | Config                                 |
| ------------------- | ------------------ | -------------------------------------- |
| Output              | boolean            | `string` / `number` / `boolean` / JSON |
| Targeting rules?    | yes                | no — values are global                 |
| Rollout percentage? | yes                | no                                     |
| Use case            | "is feature X on?" | "what value should X be?"              |

## See also

- [Quickstart](https://docs.shipeasy.ai/flags/configs/quickstart) — create your first config in 5 minutes
- [Values](https://docs.shipeasy.ai/flags/configs/values) — schema validation, JSON shapes, complex configs
- [Targeting](https://docs.shipeasy.ai/flags/configs/targeting) — when you need targeting, reach for a feature flag
- [Decision tree](https://docs.shipeasy.ai/flags/decision) — feature flag vs config vs killswitch
