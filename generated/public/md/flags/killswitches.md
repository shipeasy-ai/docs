# Killswitches

Source: https://docs.shipeasy.ai/flags/killswitches

> A flag with a single job — disable a system instantly during an incident.

A **killswitch** is a boolean flag with one purpose: be the lever you pull when something is on
fire. It looks like a [feature flag](https://docs.shipeasy.ai/flags/gates) but lives in its own list, has no rollout
percentage, and defaults to the _safe_ position so on-call doesn't have to think.

## Why a separate primitive?

Feature flags have targeting rules, ramps, and dozens of them per project. Killswitches have one switch and
a name. Mixing them is dangerous — at 3am you do not want to fat-finger a `--rollout-percent 100` instead of
`--off`.

> **Rule of thumb**

If a junior on-call engineer needs to flip this in five seconds without reading the docs, it's a
killswitch. Not a feature flag.

## Anatomy

- **[switch — the only state](#switch)** — Boolean. `on` means the system runs. `off` means it's killed. There is no rollout percentage by design.

- **[default — fail-safe](#default)** — What `gate('killswitch-name')` returns if the SDK can't reach our service. Default `true` (system runs) for most cases; `false` for new features still being qualified.

- **[audit — who flipped what](#audit)** — Every flip is recorded with actor + timestamp in the activity log. Linkable in your incident timeline.

- **[alerting — page someone](#alerting)** — Wire the `killswitch.flipped` webhook to your alerting so the team knows when production is in degraded mode.

## Lifecycle

1. **Create.** `shipeasy release killswitch create transactional.email-sender --description "Disables outbound email" --value false` (killswitch names must be `folder.name`; `--value false` means "not killed by default").
2. **Wire it in.** Wrap the call in your code:
```ts
if (!(await gate("email-sender"))) return; // killed
await sendEmail(payload);
```
3. **Page-time.** Flip it instantly:
```bash
shipeasy release killswitch update transactional.email-sender --value true
```
4. **Recover.** Once the incident is closed, flip it back and post-mortem the audit log.

## Killswitch vs feature flag vs config

| Question                | Killswitch                   | Feature flag        | Config                                |
| ----------------------- | ---------------------------- | ------------------- | ------------------------------------- |
| Output                  | boolean                      | boolean             | typed value (string/number/json/bool) |
| Targeting rules?        | no                           | yes                 | yes (per-env)                         |
| Rollout percentage?     | no                           | yes                 | n/a                                   |
| Default if unreachable? | configurable, usually `true` | `false`             | last-known-good                       |
| Use case                | break-glass during incident  | progressive rollout | non-boolean values                    |

## See also

- [Feature flags](https://docs.shipeasy.ai/flags/gates) — the everyday rollout primitive
- [Decision tree](https://docs.shipeasy.ai/flags/decision) — pick the right primitive for the change you're shipping
- [API reference](https://docs.shipeasy.ai/api) — `POST /api/admin/killswitches` etc.
- [CLI](https://docs.shipeasy.ai/get-started/cli) — `shipeasy release killswitch …` commands
