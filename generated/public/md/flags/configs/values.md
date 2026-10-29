# Dynamic values

Source: https://docs.shipeasy.ai/flags/configs/values

> Typed config values — strings, numbers, booleans, JSON — that change instantly without a redeploy. Schema-validated, versioned.

A **dynamic value** is a named JSON object on your project, validated by a schema you write. Use one when the answer to <em>"what should this be right now?"</em> is not boolean — pricing, copy, limits, feature options, API endpoints, model names, anything you'd otherwise hard-code as a constant or stash in an environment variable.

Unlike feature flags, dynamic values are **global per environment**: every user in `prod` sees the same value. To vary by user, put a feature flag around the code that reads the value, or use a [structured config](#structured-configs) with one key per cohort.

## Shape

Every value is a **JSON object** at the top level, with a [JSON Schema](#validation) describing it. A single number or string lives inside that object as a field — `{ "max_files": 5 }`, `{ "theme": "dark" }`. Fields can be strings, numbers, booleans, arrays or nested objects; the per-value size cap is plan-derived.

## Creating a value

Pick the way that suits you. All three write the same thing.

**Dashboard**

Open **Configs** in the sidebar and click **New config**. Give it a `folder.name` key, describe
its fields (the schema), and set the first value.

**CLI**

```bash
shipeasy release configs create uploads.limits \
  --schema '{"type":"object","properties":{"max_files":{"type":"number"}},"required":["max_files"]}' \
  --value '{"max_files":5}'
```

**API**

[`POST /api/admin/configs`](https://docs.shipeasy.ai/api/operations/createConfig) with `name`, `schema` and `value`.

The name is `folder.name` — two lowercase segments — and is **immutable after create**, because it
is the key your code looks the value up by. The [configs quickstart](https://docs.shipeasy.ai/flags/configs/quickstart)
walks through the whole loop.

## Creating a value

In the dashboard: **Configs → Dynamic values → New value** — give it a name,
pick a type (see [Types](#types) above), optionally attach a schema, and set
the first value. Or from the CLI, with the schema and first value in one call:

```bash
shipeasy release configs create uploads.limits \
  --schema '{"type":"object","properties":{"max_files":{"type":"number"}}}' \
  --value '{"max_files":5}'
```

The value exists as soon as the create returns; reads and updates work from
that moment on.

## Reading a value

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({ apiKey: process.env.SHIPEASY_SERVER_KEY ?? "" });

const flags = new Client(currentUser);
const limits = flags.getConfig<{ max_files: number }>("uploads.limits", {
  defaultValue: { max_files: 5 },
});
const theme = flags.getConfig<{ name: string }>("ui.theme", { defaultValue: { name: "light" } });
```

The optional generic types the return value. **Always provide a default** — your code should never crash because the SDK hasn't initialised yet, or because someone archived the value in the dashboard.

Browser:

```ts
import { configure, Client } from "@shipeasy/sdk/client";
configure({ clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "" });
const flags = new Client(currentUser);
const cfg = flags.getConfig<{ tier: string; limit: number }>("plan-defaults");
```

> **getConfig() is synchronous, like getFlag()**

Same plumbing as
<a href="/flags/gates">
  <code>getFlag()</code>
</a>
— the bundle is in memory after `configure()` resolves, so reads are a hash table lookup. There is
no async, no Promise, no fetch.

## Updating a value

Dashboard: open **Configs**, click the value, edit it, and publish. The change is in KV in <100 ms and visible to your SDK on its next poll.

CLI:

```bash
shipeasy release configs update uploads.limits --value '{"max_files":20}'
shipeasy release configs update ui.theme --prod '{"name":"dark"}'
```

`--value` publishes to every environment; `--dev`, `--staging` and `--prod` publish to just that one.

A new value creates a **revision**; you can roll back from the dashboard at any time. Every revision records the author, source (dashboard / CLI / API), and a diff against the previous value.

```bash
# Read the current value + schema
shipeasy release configs get uploads.limits
```

Revision history and rollback are dashboard-only — open the config detail view
and pick **Restore** on the revision you want.

## Structured configs [#structured-configs]

A single JSON value can encode an entire decision tree. This is great for things like plan limits, where the answer is "a struct" rather than "a value":

```json title="plan-defaults"
{
  "free": { "max_seats": 3, "history_days": 7 },
  "pro": { "max_seats": 25, "history_days": 90 },
  "ent": { "max_seats": null, "history_days": 365 }
}
```

```ts
type PlanCfg = Record<string, { max_seats: number | null; history_days: number }>;
const cfg = flags.getConfig<PlanCfg>("plan-defaults", { defaultValue: {} });
const seats = cfg[user.plan]?.max_seats ?? 3;
```

This collapses N flags into one JSON config that's **atomically updated** — no race conditions where the user sees half a new config and half the old one. The KV write is a single object, and the SDK either has the old version or the new one.

Other classic shapes:

```json title="ai-models"
{
  "default": "claude-haiku-4-5",
  "premium": "claude-opus-4-7",
  "fallback": "claude-haiku-4-5",
  "timeout_ms": 30000
}
```

```json title="copy/hero"
{
  "headline": "Ship features 10× faster",
  "sub": "Flags, configs, and killswitches — one SDK.",
  "cta_label": "Start free"
}
```

## Validation

Every value has a **schema**: a JSON Schema document (draft 2020-12) whose top level is `type: "object"`. You write it when you create the value and can change it later from the dashboard or with `shipeasy release configs update-schema`.

If a write would violate the schema, the dashboard, the CLI, and the API all reject it before it reaches KV. Bad config never goes live.

The SDK still applies a runtime decoder you supply, as a defence-in-depth:

```ts
import { z } from "zod";

const Schema = z.object({ tier: z.string(), limit: z.number() });

const cfg = flags.getConfig("plan-defaults", {
  decode: (raw) => Schema.parse(raw),
  defaultValue: { tier: "free", limit: 3 },
});
```

The SDK calls `decode` once per fetched blob — invalid payloads are dropped (with a console warning) and the previous good value is kept. Your code never sees a malformed config.

> **Schema-validated, atomically updated, versioned**

Three properties together that JSON-on-disk doesn't give you. A bad value never reaches
production. A good value is in production in seconds. A great value can be reverted in one click.

## When to use a value vs. a feature flag

| Question                           | Use                                                                |
| ---------------------------------- | ------------------------------------------------------------------ |
| Should I show feature X?           | [Feature flag](https://docs.shipeasy.ai/flags/gates).                                      |
| What should the value of N be?     | Dynamic value.                                                     |
| Different value per user / cohort? | Feature flag around the read, or structured value keyed by cohort. |
| Need an audit trail?               | Both. Every write is versioned.                                    |
| Need a kill-switch?                | [Killswitch](https://docs.shipeasy.ai/flags/killswitches).                                 |

A useful rule: if you'd say <em>"show feature X"</em>, put it behind a feature flag. If you'd say <em>"set feature X to value Y"</em>, use a dynamic value.

## CI snippet

Validate every value reference in your code resolves on the project:

```bash title=".github/workflows/ci.yml"
- name: List configured values
  run: shipeasy release configs list | jq '.data[].name'
```

Pair that with a grep across your source so a CI step fails when the code references a value that no longer exists on the project.

## Limits

How many values a project may hold, and how large a single JSON value may be, are both plan-derived — see the [pricing page](https://shipeasy.ai/pricing), or **Settings → Billing & usage** for your own numbers. A write over either limit is rejected with `PLAN_LIMIT` before it reaches KV.

If your JSON is approaching the size limit, you're probably storing data that belongs in a database, not a config. Configs are designed for "a few KB of decisions per project", not "the user's shopping cart".

**Related**

- [Targeting & rollouts](https://docs.shipeasy.ai/flags/configs/targeting) — Vary a value by user
- [Reacting to changes](https://docs.shipeasy.ai/sdks/onchange) — Act on a value the moment it changes
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — When a new value reaches your process
- [Invalidate a server cache](https://docs.shipeasy.ai/flags/case-studies/cache-invalidation-onchange) — A config flip that drops a memo
