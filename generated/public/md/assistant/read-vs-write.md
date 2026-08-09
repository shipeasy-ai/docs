# Read vs write mode

Source: https://docs.shipeasy.ai/assistant/read-vs-write

> Read tools auto-execute and stream a thinking trace; write tools never auto-run — they surface as editable cards you confirm.

The assistant has two kinds of tools, and the difference between them is the entire safety model:
**reads happen automatically; writes never do.** You don't choose a mode — the assistant picks the
right tool for what you asked, and the boundary is enforced server-side.

## Read mode — answers, auto-executed

To answer a question, the assistant calls read-only tools. These run **server-side, immediately**,
with no confirmation — they only ever look, never change. Each one streams to the chat as a
**thinking trace** line that resolves with a check mark, so you can see exactly what it inspected.

- `search_docs` (read) — Search the official Shipeasy docs and return the most relevant sections, each with a canonical `docs.shipeasy.ai` URL. Called before answering any how-it-works / how-to question, then cited in a `Sources:` line.
- `release_flags_list` (read) — List the project's gates — and its siblings `release_configs_list` /  `release_killswitch_list` for the other two primitives.
- `metrics_list` (read) — List metrics, with `metrics_series` for one metric's buckets and  `ops_list` for what is open in the queue.
- `fetch_site_page` (read) — Fetch a page from the project's configured website and return its readable text. Only the configured domain may be fetched; unavailable when no domain is set.

> **Doc-grounded, not from memory**

The assistant doesn't answer product questions from its training data. It calls
<code>search_docs</code> first and grounds the answer in the returned sections, ending with a
<code>Sources:</code> line of links — so every claim traces back to a doc page.

## Write mode — proposals, never auto-run

To change something, the assistant emits the matching write tool with its best-guess arguments —
but write tools have **no server-side executor**. The model's call streams to the client and stops.
It surfaces as an **editable confirmation card**, and the underlying change runs only after you
press **Confirm**.

That inversion is deliberate: because nothing mutates until you confirm, it's safe — and expected —
for the assistant to propose a mutation directly rather than asking "should I?" first.

The write tools cover the full resource set:

```text
release_flags_create / release_flags_update / release_flags_enable
release_flags_disable / release_flags_rollout / release_flags_archive
release_configs_create / release_configs_update / release_configs_draft
release_configs_publish / release_configs_archive
release_killswitch_create / release_killswitch_update
release_killswitch_set / release_killswitch_unset / release_killswitch_archive
metrics_create / metrics_archive
events_create / events_update / events_approve / events_archive
ops_create / ops_update / ops_notify
ops_alerts_create / ops_alerts_update / ops_alerts_archive
```

They are the same names the [MCP server](https://docs.shipeasy.ai/get-started/mcp-reference) advertises — the assistant and
an external coding agent drive one surface, not two.

> **It never claims success**

The assistant never says an action "is done." It hands you the card; you apply it. If you cancel,
nothing happened. Deleting resources is also available directly in the dashboard UI.

## Why the split holds

**Reads are pure**

Read tools only fetch — listing resources, reading docs, fetching a site page — so running them
automatically can't surprise you. They're how the assistant grounds an answer.

**Writes have no executor on the server**

Write tools are registered without an <code>execute</code> function. The model can <em>call</em>
them, but the server can't run them — the call becomes a card on the client.

**You are the executor**

The matching Server Action runs only after you confirm the card. Your session scopes everything
to the project you're viewing.

There's a third kind of tool — **presentation** tools (`ask_user`, `suggest_plan`, `select_slack_channel`) — that also skip
auto-execution but render as an interactive chooser or plan rather than a confirmation card. Those
are covered next.

**Related**

- [Confirmation cards & plans](https://docs.shipeasy.ai/assistant/cards-and-plans) — Editing a card before you confirm
- [Flags & configs](https://docs.shipeasy.ai/flags) — What each card produces
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — The same tools, for an external coding agent
