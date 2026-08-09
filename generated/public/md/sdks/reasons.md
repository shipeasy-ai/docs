# Evaluation reasons

Source: https://docs.shipeasy.ai/sdks/reasons

> getFlagDetail returns the value plus the reason a flag resolved the way it did — RULE_MATCH, DEFAULT, OFF, OVERRIDE, FLAG_NOT_FOUND, and CLIENT_NOT_READY.

`getFlag` tells you _what_ a flag resolved to. `getFlagDetail` tells you _why_ — it returns `{ value, reason }`, LaunchDarkly `variationDetail` parity, so you can log, debug, or branch on the cause rather than just the boolean.

```ts
import { configure, Client, type FlagReason } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY!,
  attributes: (u) => ({ user_id: u.id }),
});

const flags = new Client(currentUser);
const d = flags.getFlagDetail("new_checkout");
// → { value: true, reason: "RULE_MATCH" }
```

The browser entry is identical — the bound `Client` already carries the visitor's context:

```ts
import { Client } from "@shipeasy/sdk/client";

const d = flags.getFlagDetail("new_checkout");
// → { value: false, reason: "DEFAULT" }
```

## The reason enum

`FlagReason` is one of:

| reason             | meaning                                                     |
| ------------------ | ----------------------------------------------------------- |
| `CLIENT_NOT_READY` | no rules loaded yet — `init()` / `identify()` still pending |
| `FLAG_NOT_FOUND`   | the gate name isn't in the loaded rules                     |
| `OFF`              | the gate exists but is disabled / killed (server only)      |
| `OVERRIDE`         | a local override or a `?se_gate_…` URL override decided it  |
| `RULE_MATCH`       | the gate evaluated `true`                                   |
| `DEFAULT`          | the gate evaluated `false`                                  |

> **Reason is computed at the client boundary**

The wire blob carries rules, not reasons. <code>getFlagDetail</code> runs the evaluation locally
and labels the outcome — the reason is derived in the SDK, not returned by the API. That's why
<code>getFlag</code> is implemented on top of <code>getFlagDetail</code>: one evaluation, one
telemetry beacon.

On the **browser**, the edge pre-evaluates the gate's enabled/killed state into a boolean, so `OFF` never surfaces there — it folds into `DEFAULT`. `OFF` is a server-only reason.

## When to use it

`getFlagDetail` is the same single evaluation as `getFlag` — there's no extra cost. Reach for it when you need the cause, not just the answer:

- **Structured logging** — record _why_ a user did or didn't get a feature.
- **Distinguishing "off" from "not found"** — `DEFAULT` (rolled out to 0%) vs `FLAG_NOT_FOUND` (typo or stale bundle) look identical through `getFlag`.
- **Detecting a not-ready read** — `CLIENT_NOT_READY` tells you the SDK answered with the caller default because nothing had loaded yet.
- **OpenFeature** — the [provider](https://docs.shipeasy.ai/sdks/openfeature) maps these reasons onto `StandardResolutionReasons`.

Use plain `getFlag` everywhere else — it's the same evaluation with the reason discarded.

- `name` (string) — The gate name.
- `user` (User) — Only on the low-level `Engine` form (`getFlagDetail(name, user)`). Evaluation context — include `user_id` for deterministic bucketing plus any attributes your rules target. The bound `Client` omits this (the user is already bound).

**Related**

- [Use case: debug why a user isn](https://docs.shipeasy.ai/flags/case-studies/debug-missing-feature) — Reasons in practice
- [Node / TypeScript](https://docs.shipeasy.ai/sdks/node-typescript) — Server client
- [Browser / React](https://docs.shipeasy.ai/sdks/browser-react) — Client client
- [OpenFeature provider](https://docs.shipeasy.ai/sdks/openfeature) — Reason mapping
- [Rollouts](https://docs.shipeasy.ai/flags/gates/rollouts) — What drives RULE_MATCH vs DEFAULT
