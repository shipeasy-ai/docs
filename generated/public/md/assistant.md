# Assistant

Source: https://docs.shipeasy.ai/assistant

> The in-dashboard AI assistant — what it is, how read and write modes differ, what it renders, and how it meters credits.

A chat assistant built into the dashboard. It reads your project to answer questions, and proposes every change as a card you confirm — feature flags, configs, kill switches, metrics, and alert rules. Nothing happens until you approve it.

## What it is

Open the assistant from the orb in the dashboard and ask in plain language. It's scoped to the
project you're viewing and authenticates with your session — it reads live state and proposes
changes only in that project. It answers product and how-to questions by searching the same docs
you're reading now (the `search_docs` tool), and cites its sources.

> **The in-dashboard counterpart to MCP**

The assistant is the in-dashboard sibling of the [MCP server](https://docs.shipeasy.ai/get-started/mcp). MCP hands a typed
toolkit to an **external coding agent** (Claude Code, Cursor, Windsurf) running in your repo; the
assistant is the **same surface inside the dashboard** — it can't touch your code, so anything
that needs a code change is handed off as a ticket.

## Read vs write, at a glance

It works in two modes and picks the right one for you. The split is the whole safety model.

- **[Read — answer from your project](https://docs.shipeasy.ai/assistant/read-vs-write)** — Read-only tools auto-execute and stream as a **thinking trace** ("✓ Reading your project", "✓ Checking the metric series"). It never changes anything to answer.

- **[Write — propose a change](https://docs.shipeasy.ai/assistant/read-vs-write)** — Mutations never auto-run. Each surfaces as an **editable confirmation card** — it applies only when you press **Confirm**. So it's safe (and expected) for the assistant to propose a change directly instead of asking permission first.

## What it produces

Every reply is built from a small set of interactive elements rather than a wall of text — for a
whole "measure this" ask, that's an approvable plan that creates what it can and hands off the rest:

- **[Markdown + thinking trace](https://docs.shipeasy.ai/assistant/read-vs-write)** — Result-first prose, with each read tool shown as a trace line that resolves with a check mark. Doc-grounded answers end with a `Sources:` line.

- **[Choice chooser](https://docs.shipeasy.ai/assistant/cards-and-plans)** — When it needs a decision to continue (`ask_user`), it asks with clickable options instead of a numbered list — optionally with a free-text "Something else…" field.

- **[Confirmation cards](https://docs.shipeasy.ai/assistant/cards-and-plans)** — Feature flags, configs, kill switches, metrics, and alert rules — each an editable card you tweak, then **Confirm** to apply.

- **[Plan cards](https://docs.shipeasy.ai/assistant/cards-and-plans)** — Multi-step work (`suggest_plan`) as an approvable plan: **instant** resources created on the spot, plus **ship** code work captured for your team.

- **[Measurement plans](https://docs.shipeasy.ai/assistant/measurement-plans)** — "Measure this" becomes instrument-event → metric → maybe alert. The code half files a `measure_plan` ticket for an agent to implement.

- **[Credits](https://docs.shipeasy.ai/assistant/credits)** — Prepaid credits, deducted per model call. Top up from the billing tab; the chat pauses at zero.

## Where it lives

The orb sits in the dashboard chrome on every project page. Conversations are saved to your
member history and restore later. The assistant always operates on the project you're currently
viewing.

## Credits at a glance

Assistant usage is metered in prepaid credits — your plan includes a monthly allowance, and you top
up from the **billing tab** when you run low. Every model call deducts credits as it finishes. If
you run out mid-turn, the chat shows an add-credits prompt and pauses until you refill. See
[Credits & metering](https://docs.shipeasy.ai/assistant/credits).

**Related**

- [Read vs write mode](https://docs.shipeasy.ai/assistant/read-vs-write) — The safety model
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — The same surface for external coding agents
- [Flags & configs](https://docs.shipeasy.ai/flags) — What the cards produce
