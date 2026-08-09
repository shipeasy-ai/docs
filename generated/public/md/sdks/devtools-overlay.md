# Devtools overlay

Source: https://docs.shipeasy.ai/sdks/devtools-overlay

> A browser overlay to flip any gate, config, or kill switch for the current session — for QA, demos, and bug repro.

The browser SDK ships an in-page devtools panel. Open it on any page running the SDK and flip every gate, config, or kill switch **for your current session only** — without redeploying or touching the dashboard.

## Open it

- Press **`Shift+Alt+S`** on any page running the SDK, **or**
- append **`?se=1`** to the URL.

The panel mounts in a Shadow DOM overlay (isolated styles), lists every resource in your project's blob, and lets you toggle each one. Changes apply to your session and nobody else's.

> **Session-scoped, client-side only**

Overrides live in your browser for the session — they never write to the dashboard and never
affect other users. Close the session and you're back to the real evaluation.

## URL overrides

You can also force a specific resource straight from the URL — useful for sharing a repro link or scripting a QA flow:

| Param                      | Effect                    |
| -------------------------- | ------------------------- |
| `?se_gate_<name>=true`     | Force a gate on/off       |
| `?se_config_<key>=<value>` | Force a config value      |

These sit between programmatic overrides and the server's evaluation in [precedence](https://docs.shipeasy.ai/sdks/testing#overrides-on-a-real-client):

```
programmatic override  >  URL / devtools override  >  the server's evaluation
```

## When to use it

- **QA** — verify a feature behind a flag before ramping it.
- **Demos** — flip a feature on live in front of a customer.
- **Bug repro** — share a `?se_gate_…` link that reproduces the exact state.

**Related**

- [Use case: QA a flag before you ramp](https://docs.shipeasy.ai/flags/case-studies/qa-with-devtools) — The overlay in practice
- [Testing](https://docs.shipeasy.ai/sdks/testing) — Programmatic overrides
- [Browser & React](https://docs.shipeasy.ai/sdks/browser-react) — The client build
- [Feedback devtools](https://docs.shipeasy.ai/feedback/devtools) — Filing bugs from the overlay
