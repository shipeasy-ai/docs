# Docs for agents

Source: https://docs.shipeasy.ai/get-started/llms

> Machine-readable bundles of this documentation — an index, the full corpus, and a setup runbook — regenerated from the same pages you are reading.

> **This page is generated**

So is everything it describes. All of it is stitched from `content/docs` on every
regeneration, which is why it cannot drift from the pages you are reading

Point a coding agent at one of these instead of asking it to crawl the site. Every one of them is plain text served from the docs root, needs no auth, and is rebuilt whenever the documentation changes.

| Endpoint | What it is | Size |
| --- | --- | --- |
| [`/llms.txt`](https://docs.shipeasy.ai/llms.txt) | **Index** — Every page with its one-line description. Fetch this first | 34 KB |
| [`/llms-full.txt`](https://docs.shipeasy.ai/llms-full.txt) | **Full corpus** — The whole documentation in one file, in nav order | 787 KB |
| [`/agents.md`](https://docs.shipeasy.ai/agents.md) | **Setup runbook** — Install to first flag, then a full CLI + MCP reference | 121 KB |

## Which one

**Wiring Shipeasy into a repo** — [`/agents.md`](https://docs.shipeasy.ai/agents.md). It is the install → authenticate → keys → first flag → metrics → alerts path stitched in the order the work happens, followed by every CLI command and every MCP tool by name. That appendix is the part worth having in context: a hallucinated command name is the single most common way an agent fails at this.

**Answering questions about Shipeasy** — [`/llms.txt`](https://docs.shipeasy.ai/llms.txt) first, then fetch the one or two pages it points at. Cheaper and sharper than loading the corpus.

**Bulk ingestion** — [`/llms-full.txt`](https://docs.shipeasy.ai/llms-full.txt), 92 pages in one request.

## One page at a time

Every page on this site is also served as plain markdown at `/md/<path>.md` — [`/md/get-started/quickstart.md`](https://docs.shipeasy.ai/md/get-started/quickstart.md) for [the quickstart](https://docs.shipeasy.ai/get-started/quickstart), 295 files in total, generated from the same conversion as the bundles above. The **Copy page** button under any page title copies exactly that file, and **Open in** hands the URL to an assistant.

Reach for it when you know which page you want. The corpus is for when you do not.

## What is not in them

The 101 per-operation [API reference](https://docs.shipeasy.ai/api) pages and the 101 per-language [SDK reference](https://docs.shipeasy.ai/sdks) pages are **indexed in `llms.txt` but not inlined** — they are generated schema tables, and inlining them would bury the prose. Fetch the page you need, or read the [OpenAPI spec](https://docs.shipeasy.ai/api) directly.

## Skip the fetch entirely

If your agent can run MCP, the [`shipeasy` server](https://docs.shipeasy.ai/get-started/mcp) ships `docs_list`, `docs_get` and `docs_skill` — the same content, retrieved by topic instead of by URL, plus installable skills that already know these workflows. See [Install in your agent](https://docs.shipeasy.ai/get-started/agents).

**Related**

- [Install in your agent](https://docs.shipeasy.ai/get-started/agents) — skills + MCP, per host
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — what the tools do
- [Agent triggers](https://docs.shipeasy.ai/get-started/triggers) — let an alert start a run
