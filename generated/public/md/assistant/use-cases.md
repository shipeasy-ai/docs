# Assistant use cases

Source: https://docs.shipeasy.ai/assistant/use-cases

> Three worked chat flows — ramp a feature with an alert on it, generate a measurement plan, and run a read-mode audit of your flags.

The assistant is most useful on concrete tasks. Here are three real flows, each showing what you type, what it does, and where the safety rails are.

## 1. Ramp a feature with an alert watching it

You want the new pricing page behind a flag, ramped slowly, with something paging you if conversion
drops while it climbs.

> **You:** "Put the new pricing page behind a flag at 5%, and alert me if conversion falls below 3% over a day."

The assistant scopes the whole thing and surfaces it as [confirmation cards](https://docs.shipeasy.ai/assistant/cards-and-plans) you approve — it never just creates resources silently:

**It drafts the flag**

Name, default-off, and a 5% rollout — pre-filled in an editable card. Change the percentage or
add a targeting rule before confirming.

**It proposes the metric**

A conversion metric over the event you'll fire, created directly once you confirm.

**It arms the alert**

Comparator, threshold and window on that metric, as one more card. A firing rule files its own
item in the queue.

**It files the instrumentation**

The one thing it can't do from a chat — wiring <code>getFlag(...)</code> and the
<code>track</code> call into your code — is filed as a ticket for an agent.

You confirm the cards; the flag is live at 5% with a rule watching it.

## 2. Generate a measurement plan

You shipped a change and want to know if it worked, but the instrumentation isn't there yet.

> **You:** "Did the new onboarding flow improve activation? Set up whatever we need to measure it."

The assistant produces a [measurement plan](https://docs.shipeasy.ai/assistant/measurement-plans): it creates the activation metric directly, proposes the flag and the alert rule as cards, and files precise `measure_plan` tickets for the code it can't write — "fire `activated` on the first project created", "read step 3's label off `getConfig('onboarding_copy')`".

> **Why a ticket and not an edit**

The in-dashboard assistant has no repo access. A measurement plan is its way of being complete: it
builds the parts it can and hands off an unambiguous spec for the parts it can't, so a developer
or <a href="/assistant/measurement-plans">ops:work</a> agent can finish the wiring.

## 3. Read-mode audit of your flags

Sometimes you just want answers, not changes. In [read mode](https://docs.shipeasy.ai/assistant/read-vs-write) the assistant executes read tools directly — no confirmation cards, because nothing is mutated.

> **You:** "Which feature flags are still at 100% but haven't been touched in 90 days? Any I can retire?"

It queries your flags, configs and kill switches and answers in the chat — listing flags stuck at 100% for months, configs no targeting rule references, and kill switches nobody has exercised. It cites what it found; you decide what to clean up.

- `Read mode` (execute) — Queries run immediately and answer in chat — no card, nothing changes.
- `Write mode` (confirm) — Every mutation surfaces as an editable card you approve first.

This read/write split is the assistant's core safety model: reads are free, writes are always confirmed.

**Related**

- [Read vs write mode](https://docs.shipeasy.ai/assistant/read-vs-write) — Why reads execute and writes confirm
- [Cards & plans](https://docs.shipeasy.ai/assistant/cards-and-plans) — How a proposal becomes a confirmed change
- [Measurement plans](https://docs.shipeasy.ai/assistant/measurement-plans) — The plan + tickets the second flow files
