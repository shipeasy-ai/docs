# Bugs & Feature Requests

Source: https://docs.shipeasy.ai/feedback

> Capture user-reported bugs and feature requests, prioritize them, route to the right channel.

Capture bug reports and feature requests directly from your product. Prioritize, triage, and route them to the tools your team already uses — without forcing users into a 12-field form.

**Catch bugs & errors in production**

- [Add the report button](https://docs.shipeasy.ai/feedback/getting-started)
- [In-app devtools overlay](https://docs.shipeasy.ai/feedback/devtools)
- [Handled errors with see()](https://docs.shipeasy.ai/feedback/error-reporting)
- [Threshold alerts → tickets](https://docs.shipeasy.ai/metrics/alerts)

## Two record types

- **[Bugs — what's broken](#bugs)** — Title, page URL, optional stack trace and screenshot. Status flow: `open` → `in_progress` → `ready_for_qa` → `resolved`, with `wont_fix` as the exit for anything you decide not to change.

- **[Feature requests — what's missing](#feature-requests)** — Title, description and use case. Same status flow as bugs, so one queue and one set of filters covers both.

## How it works [#how-it-works]

A user files a report from your app with the [devtools overlay](https://docs.shipeasy.ai/feedback/devtools). You see it on
**Home**, the project's ops queue, within seconds, alongside tracked errors and fired alerts. A
[connector](https://docs.shipeasy.ai/feedback/connectors) can mirror it to GitHub, Google Sheets or Slack so you don't have
to live in a second tool.

## Hand a ticket to a coding agent

Any ticket in the queue can be handed to a coding agent: mention it in a comment (`@claude`,
`@cursor`, `@copilot` or `@jules`) and it starts work on the item and reports back on the ticket.
Each agent first has to be connected under **Settings → Triggers**, and mentions are **off by
default** — a project owner switches them on under **Settings → Ops**. See
[Mention an agent in a comment](https://docs.shipeasy.ai/get-started/triggers#mentions).

## Where to next

- **[Wire up the SDK](https://docs.shipeasy.ai/feedback/getting-started)** — Mount the overlay once, then users file bugs and feature requests from the page.

- **[Case studies](https://docs.shipeasy.ai/feedback/case-studies)** — "Forward bugs to Slack", "Auto-attach a session replay link", and more.

- **[API reference](https://docs.shipeasy.ai/feedback/api)** — REST endpoints for filing and triaging bugs and feature requests, plus the public intake.

- **[CLI commands](https://docs.shipeasy.ai/get-started/cli)** — `shipeasy ops …` files, lists and triages the queue.
