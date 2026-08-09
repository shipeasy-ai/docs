# Confirmation cards & plans

Source: https://docs.shipeasy.ai/assistant/cards-and-plans

> How the assistant turns an intent into an editable card you confirm — and how plan cards split instant resources from ship-code work.

When the assistant decides a change should happen, it never just does it. It renders the change as an **editable card**. You review, tweak the fields, and confirm — only then does the mutation run. This is the whole safety model of [write mode](https://docs.shipeasy.ai/assistant/read-vs-write).

## Confirmation cards

A confirmation card is a form pre-filled with the assistant's proposal. Every write resource has one:

- `Feature flag` (card) — Name, targeting rules, rollout %, default — edit before you create.
- `Dynamic config` (card) — Key, typed value, targeting. Adjust the value and ship.
- `Kill switch` (card) — Name and default. Confirm to add the break-glass switch.
- `Metric / alert rule` (card) — Event, aggregation, threshold, severity — from metrics_create and ops_alerts_create.
- `Queue item` (card) — Title, kind, priority, owner — from ops_create, before anything is filed.

The fields are the real resource schema — what you edit in the card is exactly what gets written. Nothing is hidden behind the assistant.

**The assistant proposes**

It calls a write tool. Instead of executing, the call surfaces as a card with its arguments
pre-filled.

**You edit**

Change the rollout, rename the flag, swap the metric — every field is editable.

**You confirm**

The mutation runs against the same admin endpoints the dashboard and CLI use. The card collapses
into a result.

> **The chooser**

When the assistant needs a decision from you mid-flow, the <code>ask_user</code> tool renders a
chooser — a small set of options — rather than guessing. Pick one and it continues.

A chooser comes in two shapes. **Single-choice** offers radio options and resumes the moment you
pick one; **multi-select** offers checkboxes and submits the set together on **Confirm**. Both can
carry a free-text "Something else…" escape hatch.

## Plan cards

For anything bigger than a single resource, the `suggest_plan` tool renders a **plan card** — an ordered set of steps. A plan separates two kinds of work:

- **Instant resources** — flags, configs, metrics the assistant can create directly via confirmation cards.
- **Ship-code work** — changes that need a developer or a coding agent (wiring the SDK, instrumenting an event). These are filed as tickets for [`ops:work`](https://docs.shipeasy.ai/feedback) or an external agent via the [MCP server](https://docs.shipeasy.ai/get-started/mcp), not executed in the chat.

This is why the assistant can scope an entire rollout — the flag, the metric that watches it, the alert that pages — even though it only writes the parts that are safe to write from a chat.

**Related**

- [Read vs write mode](https://docs.shipeasy.ai/assistant/read-vs-write) — Why cards exist
- [Measurement plans](https://docs.shipeasy.ai/assistant/measurement-plans) — Plans that file tickets
- [Flags & configs](https://docs.shipeasy.ai/flags) — What a release card builds
