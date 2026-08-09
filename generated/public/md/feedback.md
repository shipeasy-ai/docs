# Bugs & Feature Requests

Source: https://docs.shipeasy.ai/feedback

> Capture user-reported bugs and feature requests, prioritize them, route to the right channel.

Capture bug reports and feature requests directly from your product. Prioritize, triage, and route them to your bug tracker — without forcing users into a 12-field Jira form.

**Catch bugs & errors in production**

- [Add the report button](https://docs.shipeasy.ai/feedback/getting-started)
- [In-app devtools overlay](https://docs.shipeasy.ai/feedback/devtools)
- [Handled errors with see()](https://docs.shipeasy.ai/feedback/error-reporting)
- [Threshold alerts → tickets](https://docs.shipeasy.ai/metrics/alerts)

## Two record types

- **[Bugs — what's broken](#bugs)** — Title, page URL, optional stack trace and screenshot. Status flow: `open` → `triaged` → `resolved`.

- **[Feature requests — what's missing](#feature-requests)** — Title, importance (`nice-to-have` / `important` / `critical`), votes from other users. Status flow: `open` → `planned` → `shipped`.

## How it works [#how-it-works]

A user hits **Report bug** in your app. The SDK sends the report to Shipeasy. You see it in the
dashboard within seconds. Optional webhooks forward it to Slack / Linear / Jira so you don't have
to live in a second tool.

## Where to next

- **[Wire up the SDK](https://docs.shipeasy.ai/feedback/getting-started)** — Two lines for bugs, two for feature requests. Server or browser.

- **[Case studies](https://docs.shipeasy.ai/feedback/case-studies)** — "Add a 'Report bug' button in two minutes", "Wire user votes to a roadmap page", and more.

- **[API reference](https://docs.shipeasy.ai/feedback/api)** — REST endpoints for `bugs` and `feature-requests`.

- **[CLI commands](https://docs.shipeasy.ai/get-started/cli)** — `shipeasy feedback bugs …` and `shipeasy feedback features …`.
