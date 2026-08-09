# Quickstart

Source: https://docs.shipeasy.ai/flags/killswitches/quickstart

> Wire a killswitch around a risky subsystem in five minutes — so the 3am on-call has one switch to flip.

A killswitch is the lever you pull when something is on fire. This walkthrough takes you from zero
to a wired-in killswitch around an outbound-email path. By the end, on-call can disable email
sending in under five seconds without touching code.

**Create the killswitch (default OFF)**

```bash
shipeasy release killswitch create transactional.emails-enabled --value false
```

**Guard the dangerous path**

```bash
if (flags.ks('transactional.emails-enabled')) return; // killed → bail
```

**Flip it, watch it stop**

```bash
shipeasy release killswitch update transactional.emails-enabled --value true
```

**Subscribe a connector (Slack / GitHub / etc.)**

```bash
Add via Dashboard → Feedback → Connectors → killswitch.flipped
```

## 1. Create the killswitch

```bash
shipeasy release killswitch create transactional.emails-enabled \
  --description "Disables outbound transactional email" \
  --value false
```

Killswitch names must be `folder.name`. `--value false` means "killed = false" by
default — the call to `flags.ks(...)` returns `false`, your code reads "not
killed, proceed". Flip it to `true` to kill the path in production. Until the
SDK has fetched the first blob, reads return `false` (the safer default for
"is this killed?") — so a cold cache won't accidentally kill your emails.

## 2. Wire it into the code path

Wrap the dangerous call with the killswitch read — it returns `true` when the
killswitch is flipped, `false` (or the SDK default) otherwise:

**TypeScript**

```ts title="src/lib/mailer.ts"
import { flags } from "@shipeasy/sdk/server";

export async function sendOrderEmail(order: Order) {
  if (flags.ks("transactional.emails-enabled")) {
    logger.warn("emails paused via killswitch", { orderId: order.id });
    return;
  }

  await mailer.send(order);
}
```

**Python**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Python](https://docs.shipeasy.ai/sdks/python) for the full client API.

**Go**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Go](https://docs.shipeasy.ai/sdks/go) for the full client API.

**Ruby**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Ruby](https://docs.shipeasy.ai/sdks/ruby) for the full client API.

**Java**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Java](https://docs.shipeasy.ai/sdks/java) for the full client API.

**Kotlin**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Kotlin](https://docs.shipeasy.ai/sdks/kotlin) for the full client API.

**PHP**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [PHP](https://docs.shipeasy.ai/sdks/php) for the full client API.

**Swift**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Swift](https://docs.shipeasy.ai/sdks/swift) for the full client API.

Three things to internalise:

- **`undefined` for `ctx`.** Killswitches don't target — they're global. The second arg is just there to keep the function signature aligned with `gate()`.
- **`defaultValue: true` is load-bearing.** Don't omit it. If KV is unreachable during the very incident that prompted the kill, you do not want the killswitch to silently default to `false` and amplify the outage.
- **Log the bypass.** When the killswitch is engaged, log a structured warn so post-mortem can reconstruct what was suppressed.

Deploy this. Killswitch is `on`, fallback is `true`, behaviour is unchanged from before.

## 3. Rehearse the flip

The most common reason a killswitch fails to help during an incident is that no one has ever
flipped it before. Rehearse in staging:

```bash
# Flip the killswitch to true ("kill the path") — single-value form
shipeasy release killswitch update transactional.emails-enabled --value true

# Confirm via the SDK eval endpoint
curl "https://api.shipeasy.ai/sdk/evaluate" \
  -H "Authorization: Bearer $SHIPEASY_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "user": { "user_id": "drill-user" } }' \
  | jq '.killswitches["transactional.emails-enabled"]'
# → true

# Verify no emails flow in staging
# … run your normal email test path …

# Re-enable (flip back to false = "not killed")
shipeasy release killswitch update transactional.emails-enabled --value false
```

Time how long it takes from "decide to flip" to "next email is suppressed."
The next call should return the new value within one poll interval of the
flip — that interval is plan-derived and advertised to the SDK, not configured.

## 4. Get notified when the killswitch flips

A killswitch is a _social_ signal as much as a technical one. Flipping it
should announce itself on the team's incident channel and create a paper
trail.

Today this is wired through the **Feedback → Connectors** surface in the
dashboard. Pick `killswitch.flipped` as the event, point it at a Slack or
GitHub connector, and configure the filter (e.g. only fire for prod, or
only for specific killswitch names). The connector payload includes who
flipped it, when, and the new value — wire it into your incident channel
and your runbook ("if you see this, page primary on-call within 2 minutes").

For production-grade pages, point the connector at PagerDuty or Opsgenie —
that way flipping the killswitch _is_ declaring the incident, which is
usually the right move.

## What you have now

- A killswitch in the dashboard at **Killswitches → emails-enabled**.
- A wrapped code path that respects it on every call.
- A rehearsed flip-and-restore drill that took < 5 seconds.
- An alert on the flip event so the team knows when production is in degraded mode.

That's the whole pattern. Repeat for every system whose pause-button you'd want on the lock screen
of your phone.

## Where to next

- **[When to add a killswitch](https://docs.shipeasy.ai/flags/killswitches/patterns)** — Which subsystems deserve one — and which should stay feature flags.

- **[Feature flags vs killswitches](https://docs.shipeasy.ai/flags/gates)** — Same primitive at the wire level, different ergonomics. When to reach for which.

- **[Worked example: paused emails](https://docs.shipeasy.ai/flags/case-studies#kill-emails)** — The walkthrough from the case-studies page, with more context on the incident.

**Related**

- [Patterns](https://docs.shipeasy.ai/flags/killswitches/patterns) — What belongs behind one, and what does not
- [Maintenance mode](https://docs.shipeasy.ai/flags/case-studies/maintenance-mode) — The worked incident
- [Which primitive?](https://docs.shipeasy.ai/flags/decision) — Killswitch vs flag vs config
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — How fast a flip actually lands
