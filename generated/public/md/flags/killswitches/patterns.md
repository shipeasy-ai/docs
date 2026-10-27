# Patterns

Source: https://docs.shipeasy.ai/flags/killswitches/patterns

> When a killswitch is the right answer — what to put behind one, cold-cache behaviour, alerting, and the post-incident cleanup.

A killswitch is a flag with one job: be the lever you pull when something is on fire. That makes
it the wrong tool for most things — most things don't need a 3am-grade pause button. This page is
the decision guide: when to add one, what to put behind it, and how to keep them maintained.

## What deserves a killswitch

The rule of thumb: **if a junior engineer on-call would need to flip this in five seconds without
reading the docs, it's a killswitch.** Otherwise it's a feature flag.

Concrete examples that _do_ deserve one:

- **Outbound side effects.** Email, SMS, push notifications, webhook fan-out. If your vendor goes down or starts retrying spuriously, you want one switch to stop the volume.
- **Paid third-party calls.** Anything that costs money per call — LLM inference, payment-provider webhooks, fraud-scoring APIs. If their pricing goes weird or their service hangs, kill it.
- **Write-heavy background workers.** Batch indexers, report generators, anything that mutates data in bulk. If they're producing bad output, pausing is cheaper than rolling back.
- **Risky new subsystems in the first month after launch.** A new payment integration, a new recommender, a new auth path. You'll feel the absence of a killswitch in the first incident.

Examples that should _not_ be killswitches:

- **Feature rollouts.** That's what feature flags are for. A killswitch has no rollout percentage by design — you can't ramp it.
- **Percentage splits.** Use a [feature flag](https://docs.shipeasy.ai/flags/gates) with a rollout percentage. A killswitch can't express "50% see the new path."
- **Permission checks.** Killswitches bypass on incident, which is the opposite of what you want from an authz check.
- **Anything you'd put behind a feature flag _and_ might never flip.** That's a config or a feature flag.

## Cold-cache behaviour

Every killswitch read has an answer even when the SDK can't reach us: **`false` — not killed.**
Until the first rule set arrives, or if it can't be refreshed, the guarded path keeps running as it
did before you added the switch. That is deliberate: a Shipeasy outage must not, by itself, pause
your email or fail your payments.

It also decides what belongs behind a killswitch. A killswitch can only ever _stop_ a path, never
start one. If the dangerous outcome is _skipping_ a call (a fraud check, an audit-log redaction),
don't put a killswitch in front of it — keep it unconditional, or use a
[flag](https://docs.shipeasy.ai/flags/gates) whose default you set at the call site.

```ts
const client = new Client(currentUser);

// Whole-path pause — true means "killed, bail out":
if (client.getKillswitch("emails-paused")) return;

// A named override for one region, read through the same call:
if (client.getKillswitch("payments-paused", "eu_region")) return;
```

## Audit + alerting

A killswitch flip is an incident-grade event. Two things should happen when one flips:

1. **The flip is recorded.** Who flipped it, when, from what surface (dashboard, CLI, API), and
   the new value.
2. **The team hears about it.** Turn on **Killswitch flipped** under **Settings → Notifications →
   Events** for the channels you use — in-app, email, Slack. The flip should declare the incident,
   not require someone to remember to.

Slack is the usual choice for the incident channel: connect it on the same tab, pick the channel,
and the post carries a one-click **Flip back**.

## Naming

Killswitch names appear in incident timelines and post-mortems. Pick names that read naturally in
that context:

- ✓ `emails-paused`, `payments-paused`, `recommender-paused` — reads as "is this system paused?"
- ✗ `emails-enabled`, `email-killswitch`, `disable-recs` — the first inverts what `true` means, and the others hide whether `true` or `false` is "running."

The convention: `<system>-paused`. Then `getKillswitch("emails-paused")` returning `true` reads as
"yes, emails are paused" — which is exactly what the SDK returns when the switch is thrown.

## Post-incident cleanup

A killswitch flipped during an incident, the team fixed the underlying bug, and the switch is
back on. Two cleanup steps that often get skipped:

1. **Verify the killswitch still works.** A flipped-then-restored killswitch sometimes drifts —
   maybe someone removed the in-code feature flag during the fix, or the notification moved. Re-rehearse the
   flip in staging within a week.
2. **Update the runbook.** What was the trigger for this flip? Add it to the on-call runbook so
   the next engineer doesn't have to figure it out from scratch. The flip record is the raw
   material — turn it into a sentence in the runbook.

If a killswitch hasn't been flipped (even in staging) in 6 months, it might still work — but you
don't know. Re-rehearse.

## Killswitches in your tests

A killswitch wraps a real side effect. Your tests almost certainly don't want to actually send
emails, but they also shouldn't bypass the killswitch path in a way that hides bugs in the wrapper
itself.

The cleanest pattern: in test environments, run the SDK in **bundle-mock mode** with the killswitch
set to whatever the test scenario needs:

```ts title="test/setup.ts"
import { configureForOffline } from "@shipeasy/sdk/server";

configureForOffline({
  snapshot: {
    flags: {
      version: "test",
      plan: "free",
      gates: {},
      configs: {},
      // `killed: 1` = the switch is thrown, so getKillswitch() returns true
      killswitches: { emails: { killed: 1 }, payments: { killed: 0 } },
    },
    experiments: { version: "test", universes: {}, experiments: {} },
  },
});
```

The SDK never hits the network in this mode, the killswitch values are deterministic, and your
test reads through the same `new Client(user).getKillswitch()` call your production code does — no
special-case bypass. `configureForOffline()` replaces the active configuration, so a suite can
re-seed between cases.

## The dashboard view

The **Killswitches** page shows the current state of every killswitch in your project and when
it was last published, with a **Turn ON** / **Turn OFF** control on each row. Keep it pinned during
incidents — it's the central console.

If a switch has been flipped 5 times in the last week, that's a signal that the underlying system
needs a real fix, not just a kill button.

**Related**

- [Killswitch quickstart](https://docs.shipeasy.ai/flags/killswitches/quickstart) — Wiring the first one
- [Maintenance mode](https://docs.shipeasy.ai/flags/case-studies/maintenance-mode) — A subsystem behind break-glass
- [Per-tenant killswitch](https://docs.shipeasy.ai/flags/case-studies/per-tenant-killswitch) — Disable one tenant, not everyone
- [Configure alerts](https://docs.shipeasy.ai/metrics/alerts) — Let the metric tell you to flip it
