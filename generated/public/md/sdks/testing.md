# Testing

Source: https://docs.shipeasy.ai/sdks/testing

> Swap configure() for configureForTesting() and seed the values your code should see — unit-test flag-gated code without touching the network.

Code that reads flags shouldn't need a live connection to test. Swap the live `configure()` for **`configureForTesting()`** — a drop-in sibling with **no network, ever** and no SDK key required. It seeds the values your code should see, and you read them back through the ordinary `new Client(user)`. In this mode the rules never fetch, `track()` is a no-op, `assign()` logs no exposure, and telemetry is off.

> **Same read path as production**

Unlike <code>configure()</code> (first-config-wins), <code>configureForTesting()</code> and
<code>configureForOffline()</code> <em>replace</em> the active configuration — a suite can
reconfigure freely between cases. Your code under test keeps calling <code>new Client(user)</code>
exactly as it does in production.

## Seed the values

```ts
import { configureForTesting, Client, clearOverrides } from "@shipeasy/sdk/server"; // or /client

configureForTesting({
  flags: { new_checkout: true },
  configs: { upload_limits: { max_uploads: 50 } },
});

const flags = new Client({ user_id: "u_1" });
flags.getFlag("new_checkout"); // true
flags.getConfig("upload_limits"); // { max_uploads: 50 }

clearOverrides(); // reset every seeded override back to the empty-blob default
```

`configureForTesting({ flags?, configs?, attributes? })`:

| Field        | Shape                 | Effect                                             |
| ------------ | --------------------- | -------------------------------------------------- |
| `flags`      | `{ [name]: boolean }` | forced `getFlag` results                           |
| `configs`    | `{ [name]: value }`   | forced `getConfig` results                         |
| `attributes` | `(yourUser) => User`  | same transform as `configure()` (default identity) |

## Package-level overrides

Layer a quick override on top of whatever `configureForTesting()` / `configureForOffline()` — or even a live `configure()` — set up. These are package-level; there's no object to hold:

```ts
import { overrideFlag, overrideConfig, clearOverrides } from "@shipeasy/sdk/server"; // or /client

overrideFlag("new_checkout", true);
overrideConfig("upload_limits", { max_uploads: 50 });
// …read through `new Client(user)` …
clearOverrides(); // drop every on-the-spot override
```

## Overrides on a real client

A programmatic override always wins, including against a live configuration. In the browser the precedence is:

```
programmatic override  >  URL / devtools override (?se_gate_… )  >  the server's evaluation
```

> **Two ways to mock**

Use <code>configureForTesting()</code> + <code>override*</code> to seed individual values; use
<code>configureForOffline()</code> with a <a href="/sdks/offline-snapshot">snapshot</a> when you
want the <em>real</em> rule set evaluated offline. They compose — overrides apply on top of a
snapshot too.

**Related**

- [Use case: deterministic flags in CI and tests](https://docs.shipeasy.ai/flags/case-studies/deterministic-tests) — forTesting + snapshots in practice
- [Offline & snapshots](https://docs.shipeasy.ai/sdks/offline-snapshot) — Real eval, no network
- [Devtools overlay](https://docs.shipeasy.ai/sdks/devtools-overlay) — URL overrides in the browser
- [Node / TypeScript](https://docs.shipeasy.ai/sdks/node-typescript)
