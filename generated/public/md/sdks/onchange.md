# Reacting to changes

Source: https://docs.shipeasy.ai/sdks/onchange

> onChange fires after a background poll picks up new rules — use it to invalidate caches or re-render when a flag flips.

Reads are synchronous against an in-memory rule set that a background poll keeps fresh. `onChange` lets you react the moment that rule set swaps — for cache busting, re-rendering, or logging a config flip.

Change listeners live on the `Engine` — the heavyweight client. Everyday flag reads use `configure` + `new Client(user)`; here you hold the `Engine` itself so you can subscribe to its poll cycle.

## Server

The server `Engine` fires registered listeners after a background poll **returns new data** (HTTP 200, not a 304). It returns an unsubscribe function, and never fires in test or offline mode (no polling happens there).

```ts
import { Engine } from "@shipeasy/sdk/server";

const engine = new Engine({ apiKey: process.env.SHIPEASY_SERVER_KEY! });
await engine.init();

const unsubscribe = engine.onChange(() => {
  console.log("flag rules changed — re-evaluating");
  rebuildRenderCache();
});

// on shutdown
unsubscribe();
```

> **Only fires on real changes**

The poll sends an <code>ETag</code>; an unchanged body comes back <code>304</code> and listeners
stay quiet. You only wake up when something actually changed in the dashboard.

## Browser

The browser `Engine` exposes the equivalent `subscribe()`, which fires after each `identify()` and after any override change — exactly when a re-render is warranted.

```ts
import { Engine } from "@shipeasy/sdk/client";

const unsubscribe = engine.subscribe(() => {
  renderFlags();
});
```

## When to use it

- **Cache invalidation** — drop a memoized render or a derived config when rules change.
- **Long-lived servers** — re-evaluate a flag that gates a background job without restarting.
- **Dashboards** — reflect a flag flip live without a page reload.

For one-shot serverless reads there is nothing to subscribe to — see [init vs initOnce](https://docs.shipeasy.ai/sdks/node-typescript#init-vs-initonce-serverless).

**Related**

- [Use case: invalidate a cache when a config flips](https://docs.shipeasy.ai/flags/case-studies/cache-invalidation-onchange) — onChange in practice
- [Node / TypeScript](https://docs.shipeasy.ai/sdks/node-typescript) — init() + the server client
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — How polling works
- [Evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) — Why a flag resolved
