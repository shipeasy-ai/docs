# QA a flag before you ramp (and share a repro link)

Source: https://docs.shipeasy.ai/flags/case-studies/qa-with-devtools

> Use the devtools overlay (Shift+Alt+S / ?se=1) and ?se_gate_… URL overrides to QA a feature, demo a variant, and reproduce a bug — all session-scoped.

A flag is built but sitting at 0%, and QA needs to verify it before you ramp. You don't want to flip the dashboard (that's everyone) and you don't want a special build (that's a deploy). You want to see the feature on your own screen, right now — and ideally hand a teammate a link that reproduces the exact state.

The browser SDK ships a [devtools overlay](https://docs.shipeasy.ai/sdks/devtools-overlay) for precisely this: flip any gate, config, or kill switch **for your session only**.

## Open the overlay

- Press **`Shift+Alt+S`** on any page running the SDK, **or**
- append **`?se=1`** to the URL.

It mounts in a Shadow DOM overlay, lists every resource in your project's blob, and lets you toggle each one. Your changes apply to your session and nobody else's.

> **Session-scoped, client-side only**

Overrides live in your browser for the session — they never write to the dashboard and never
affect other users. Close the session and you're back to the real evaluation.

## Share a repro link with URL overrides

For QA flows, demos, and bug reports, force state straight from the URL — paste the link and the receiver lands in the same state:

| Param                      | Effect               |
| -------------------------- | -------------------- |
| `?se_gate_<name>=true`     | Force a gate on/off  |
| `?se_config_<key>=<value>` | Force a config value |

For example, `https://app.example.com/checkout?se_gate_new_checkout=true` shows the QA reviewer the new checkout while it's still at 0% for real traffic.

These sit between programmatic overrides and the server's evaluation in precedence:

```
programmatic override  >  URL / devtools override  >  the server's evaluation
```

## Rollout & measurement plan

- **QA at 0%, then ramp.** Verify the feature on your own session before any real user is in the rollout — the URL override is your pre-flight check.
- **Demos without a deploy.** Flip the feature on live in front of a customer, then close the session.
- **Bug repro links beat screenshots.** A `?se_gate_…` link reproduces the exact state for whoever opens it, so the bug is reproducible instead of described.

**Related**

- [Devtools overlay](https://docs.shipeasy.ai/sdks/devtools-overlay) — The overlay + URL override params
- [Testing](https://docs.shipeasy.ai/sdks/testing) — Programmatic overrides and precedence
- [Debug a missing feature](https://docs.shipeasy.ai/flags/case-studies/debug-missing-feature) — Reason-driven triage
