# Measurement plans

Source: https://docs.shipeasy.ai/assistant/measurement-plans

> When a change needs instrumentation it can't do itself, the assistant writes a measurement plan and files measure_plan tickets for an agent to implement.

The assistant can create flags, configs, and metrics directly. What it _can't_ do from a chat is edit your codebase — wire the SDK, fire the right `track()` call, add the event. A **measurement plan** bridges that gap: the assistant designs the full measurement, creates the parts it can, and files the rest as tickets for an agent to implement.

## What it produces

When you ask the assistant to "measure whether X works", it produces a plan that typically contains:

**A success metric**

Created directly via <code>metrics_create</code> — the event and the aggregation over it.

**The resources it can build**

The flag, config or alert rule, as <a href="/assistant/cards-and-plans">confirmation cards</a>
you approve.

**Instrumentation tickets**

The code changes it can't make itself — "fire <code>purchase</code> on checkout success", "wrap
the CTA in <code>getFlag('new_cta')</code>" — filed as <code>measure_plan</code>
tickets.

## How the tickets get implemented

A `measure_plan` ticket lands in the same operational queue as bugs and feature requests. From there:

- A developer picks it up, or
- [`ops:work`](https://docs.shipeasy.ai/feedback) (the unattended agent loop) implements it as an atomic diff, or
- An external coding agent via the [MCP server](https://docs.shipeasy.ai/get-started/mcp) handles it.

> **Why a ticket and not a direct edit**

The in-dashboard assistant has no repo access — it can't open a PR. Filing a precise
instrumentation ticket is its substitute for implementation: it specifies exactly what to fire and
where, so whoever (or whatever) picks it up has an unambiguous spec.

## The website assistant

The same mechanism powers the marketing-site assistant: a visitor describes what they want to measure, and instead of hand-waving, it files an implementation-ready `measure_plan` so an agent can wire it up once they connect a repo.

**Related**

- [Metrics](https://docs.shipeasy.ai/metrics) — What a measurement plan defines
- [Bugs & requests](https://docs.shipeasy.ai/feedback) — The queue measure_plan tickets land in
- [Cards & plans](https://docs.shipeasy.ai/assistant/cards-and-plans) — Instant vs ship-code work
