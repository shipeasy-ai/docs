# Quickstart

Source: https://docs.shipeasy.ai/flags/configs/quickstart

> Create a typed config, read it with getConfig, change the value in production — no redeploy, five minutes end to end.

This walks you through replacing one hard-coded constant with a config you can change from a
dashboard. You'll create the config with a schema, read it in code with a guaranteed fallback, then
change the value in production and watch it land without a deploy.

**Install the SDK & log in**

```bash
npm install @shipeasy/sdk && npx shipeasy login
```

**Create the config with its shape and first value**

```bash
shipeasy release configs create uploads.limits --schema '{"type":"object","properties":{"max_files":{"type":"number"}}}' --value '{"max_files":5}'
```

**Read it where the constant used to be**

```bash
const cfg = new Client(currentUser)
  .getConfig('uploads.limits', { defaultValue: { max_files: 5 } });
```

**Raise the limit in production**

```bash
shipeasy release configs update uploads.limits --prod '{"max_files":20}'
```

## Prerequisites

- A Shipeasy project. Starting one costs nothing.
- A **server SDK key** for the environment you're deploying to:

```bash
shipeasy sdk keys create --type server
```

- The SDK in your project:

```bash
npm install @shipeasy/sdk
```

## 1. Initialise once at boot

Same one call every Shipeasy product runs on — configs ride the bundle the SDK already keeps in
memory, so a config read costs no network.

```ts title="src/lib/shipeasy.ts"
import { configure } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY!,
  attributes: (user: AppUser) => ({ user_id: user.id, plan: user.plan }),
});
```

> **One configure call, one key**

The server key goes on the server and the client key in the browser — never the other way round,
and never both. See [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments)

## 2. Create the config

A config is a **JSON object** with a schema. The schema is not decoration: every value published
afterwards is validated against it, so a typo in a dashboard field is refused at the edit rather
than discovered by your parser at 3am.

```bash
shipeasy release configs create uploads.limits \
  --description "Per-plan upload ceilings" \
  --schema '{"type":"object","properties":{"max_files":{"type":"number"},"max_mb":{"type":"number"}},"required":["max_files"]}' \
  --value '{"max_files":5,"max_mb":25}'
```

Two things about the name. It is `folder.name` — two lowercase segments — and it is **immutable
after create**, because it is the key your code looks the value up by. Pick it as carefully as you
would a database column.

Without `--value` the config starts as `{}` on every environment, which your default will have to
cover. Seeding one environment at a time works too — `--dev`, `--staging`, `--prod` each publish to
just that one.

Or in the dashboard: **Configs → Dynamic values → New**

## 3. Read it where the constant used to be

```ts title="src/upload/limits.ts"
import { Client } from "@shipeasy/sdk/server";

interface UploadLimits {
  max_files: number;
  max_mb?: number;
}

export function limitsFor(user: AppUser): UploadLimits {
  return new Client(user).getConfig<UploadLimits>("uploads.limits", {
    defaultValue: { max_files: 5 },
  });
}
```

`getConfig` is **synchronous** — the bundle is already in memory, so this is a hash-table lookup, not
a fetch. The same call works in the browser build from `@shipeasy/sdk/client`.

> **Always pass a defaultValue**

Without one, `getConfig` returns `undefined` whenever the key is absent or the SDK has not
finished its first load — and a config read that can be `undefined` on a cold boot is a crash
waiting for your next deploy. The default is what your code did before you made the value dynamic,
so you already know it

Validating as you read costs one line, and turns a malformed value into a fallback instead of an
exception downstream:

```ts
new Client(user).getConfig("uploads.limits", {
  decode: (raw) => UploadLimitsSchema.parse(raw),
  defaultValue: { max_files: 5 },
});
```

If `decode` throws, the SDK warns and hands back the default.

## 4. Change the value

```bash
shipeasy release configs update uploads.limits --prod '{"max_files":20,"max_mb":100}'
```

`--prod` publishes to production only, immediately. Pass `--value` instead to publish the same value
to every environment at once.

The new value is in KV in under 100 ms; your running processes pick it up on their next background
poll, with no redeploy and no restart. Nothing in step 3 changes.

If you need to act the moment a value moves — drop a cache, rebuild a derived object — subscribe
with [`onChange`](https://docs.shipeasy.ai/sdks/onchange) rather than polling it yourself.

## What just happened

You moved one number out of your source and into something you can change from a phone. The read
path did not get slower: the value rides the same in-memory bundle your flags do, refreshed in the
background, so `getConfig` stays a lookup.

What you have now that a constant could not give you: a schema that refuses malformed edits, a
version history per environment, and a fallback that keeps the code running when the value is
missing.

## Where to next

- **[Dynamic values](https://docs.shipeasy.ai/flags/configs/values)** — Types, structured configs, size limits, and how a value is versioned per environment.

- **[Targeting & rollouts](https://docs.shipeasy.ai/flags/configs/targeting)** — Vary a value by user, or ramp a new one the way you would ramp a feature flag.

- **[Config, flag, or killswitch?](https://docs.shipeasy.ai/flags/decision)** — Three primitives, one question — which one fits the change you are shipping.

**Related**

- [Dynamic values](https://docs.shipeasy.ai/flags/configs/values) — Types and structured configs
- [Reacting to changes](https://docs.shipeasy.ai/sdks/onchange) — Act the moment a value moves
- [Plan entitlements with a config](https://docs.shipeasy.ai/flags/case-studies/entitlements-with-configs) — One config instead of a flag sprawl
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — When a new value reaches your process
