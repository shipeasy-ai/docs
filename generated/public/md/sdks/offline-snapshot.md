# Offline & snapshots

Source: https://docs.shipeasy.ai/sdks/offline-snapshot

> Build a fully offline client from a captured snapshot — real evaluation, zero network. For CI, tests, and air-gapped runtimes.

Sometimes you want real flag evaluation with **no network at all** — a CI job, a deterministic test, an air-gapped runtime. A snapshot is just the two SDK wire bodies captured to disk; the client evaluates the real rules against it.

## The snapshot shape

A snapshot is the bodies of both SDK wire endpoints, `GET /sdk/flags` and `GET /sdk/experiments` — the second is required even when your tests only read flags and configs:

```jsonc
// snapshot.json
{
  "flags":       /* body of GET /sdk/flags */,
  "experiments": /* body of GET /sdk/experiments */
}
```

## Load it

`fromFile` / `fromSnapshot` build an `Engine` — the heavyweight client — from the captured blob. (Everyday flag reads use `configure` + `new Client(user)`; here you build an isolated, offline `Engine`.)

```ts
import { Engine } from "@shipeasy/sdk/server";

// from a file (Node only — reads with node:fs)
const engine = Engine.fromFile("./snapshot.json");

// or from a parsed object you already hold (works anywhere)
const engine = Engine.fromSnapshot({ flags, experiments });

engine.getFlag("new_checkout", { user_id: "u1" });
```

Evaluations run the **real** eval against the snapshot. `init()` / `initOnce()` / `track()` are no-ops, and `override*` setters still apply on top — handy for forcing a specific case in a test.

> **fromFile is Node-only**

<code>fromFile</code> reads the file with <code>node:fs</code>. In a browser, an edge runtime, or
anywhere without a filesystem, fetch or import the JSON yourself and pass it to
<code>fromSnapshot</code>.

## When to use it

- **CI / tests** — deterministic evaluation with no live dependency.
- **Air-gapped or offline runtimes** — ship a snapshot alongside the build.
- **Reproducing a bug** — capture production rules once and replay them locally.

For seeding individual values without a snapshot, use [`configureForTesting()` + overrides](https://docs.shipeasy.ai/sdks/testing) instead.

**Related**

- [Use case: deterministic flags in CI and tests](https://docs.shipeasy.ai/flags/case-studies/deterministic-tests) — Snapshots in practice
- [Testing](https://docs.shipeasy.ai/sdks/testing) — forTesting + override*
- [Node / TypeScript](https://docs.shipeasy.ai/sdks/node-typescript) — The server client
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — What the wire bodies contain
