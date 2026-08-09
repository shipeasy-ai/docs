# Shipeasy

Source: https://docs.shipeasy.ai

> Feature flags & configs, metrics & alerts, and bug + error capture — one SDK, one API key, for everything you ship.

Feature flags, typed runtime configs, kill switches, metrics & threshold alerts, and bug + error capture — one SDK, one API key. Drive it by hand, by CLI, or by an AI agent.

## Start here

- **[Quickstart](https://docs.shipeasy.ai/get-started/quickstart)** — Install, wire one `configure()` call, ship a flag — from zero to live in five minutes.

- **[How it works](https://docs.shipeasy.ai/get-started/overview)** — Fast local reads, explicit edge writes, sub-second propagation. The mental model behind every product.

- **[Browse the SDKs](https://docs.shipeasy.ai/sdks)** — One package for server + browser, plus native ports for Go, Python, Ruby, Java, Kotlin, PHP and Swift.

## Explore by product

- **[Flags & Configs](https://docs.shipeasy.ai/flags)** — Feature flags for ramps, typed configs for values you change without a deploy, and killswitches for break-glass.

- **[Metrics & Alerts](https://docs.shipeasy.ai/metrics)** — Turn events into metrics with a small DSL, watch them move as you ramp, and raise threshold alerts that file their own tickets.

- **[Bugs & Requests](https://docs.shipeasy.ai/feedback)** — User-reported bugs, feature requests, and handled errors — captured in-app and routed into your tooling.

- **[SDKs](https://docs.shipeasy.ai/sdks)** — One package, server + browser builds, plus native ports for Go, Python, Ruby, Java, Kotlin, PHP and Swift.

- **[Assistant](https://docs.shipeasy.ai/assistant)** — Ask questions about your project, and let the assistant draft flags, configs, and measurement plans as editable cards.

- **[Get started](https://docs.shipeasy.ai/get-started/overview)** — Install the SDK, authenticate, learn the core concepts, and hand setup to a coding agent.

## Or start from a goal

Most teams arrive with an outcome in mind. Each path is an ordered set of pages that takes you from
install to shipped.

**Ship a feature behind a flag**

- [Add the SDK & CLI](https://docs.shipeasy.ai/get-started/install)
- [Your first feature flag](https://docs.shipeasy.ai/flags/gates/quickstart)
- [Rules & audiences](https://docs.shipeasy.ai/flags/gates/targeting)
- [Gradual rollout](https://docs.shipeasy.ai/flags/gates/rollouts)

**Know whether the ramp is safe**

- [Define a metric](https://docs.shipeasy.ai/metrics/quickstart)
- [The metric DSL](https://docs.shipeasy.ai/metrics/grammar)
- [Threshold alerts](https://docs.shipeasy.ai/metrics/alerts)

**Catch bugs & errors in production**

- [Add the report button](https://docs.shipeasy.ai/feedback/getting-started)
- [In-app devtools overlay](https://docs.shipeasy.ai/feedback/devtools)
- [Handled errors with see()](https://docs.shipeasy.ai/feedback/error-reporting)
- [Threshold alerts → tickets](https://docs.shipeasy.ai/metrics/alerts)

**Let an AI agent run it all**

- [Install the MCP server](https://docs.shipeasy.ai/get-started/mcp)
- [Set up your agent](https://docs.shipeasy.ai/get-started/agents)
- [Drive it from the CLI](https://docs.shipeasy.ai/get-started/cli)

## Not sure which primitive?

Inside **Flags & Configs** there are three primitives. This picker maps "I want to do X" to the
right one.

Full breakdown → [decision guide](https://docs.shipeasy.ai/flags/decision).

## Why Shipeasy

- **One SDK** for feature flags, configs, kill switches, metrics, and feedback. Server _and_ client.
- **One CLI** (`shipeasy`) for everything you can do in the dashboard.
- **One MCP server** so your AI agent can do the boring setup for you.
- **Sub-millisecond evaluation**: flags resolve in your code without a network round-trip.
- **Export your data**: your events and metric series are yours, not locked into our dashboard.
