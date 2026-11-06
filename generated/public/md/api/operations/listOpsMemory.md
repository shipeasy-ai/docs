# Search project memory

Source: https://docs.shipeasy.ai/api/operations/listOpsMemory

> >-

What the project already learned from the tickets it shipped — the
decisions the team made in answered questions, what QA found, which files
a feature lives in, the PR that shipped it, and the requests that were
turned down. Every entry is derived from the item's own records
(investigations, questions, QA notes, linked PRs) and is rebuilt whenever
those change, so it never disagrees with the ticket.

Search with `q` (free text), `paths` (comma-separated files or
directories — entries that touched them rank first), `item` (a queue
item — its title and description become the query, and its own entries
are left out) or `trail` (a trail — its title, intent and goal become the
query; its own and its items' entries are left out). With none of them, the newest entries come back. Bodies are
capped; read the full ticket with `ops get <item>`.

**Use case:** A coding agent picks up a ticket and, before reading the
repo, asks what was already decided and built around it:
`ops memory search --item 42`.
