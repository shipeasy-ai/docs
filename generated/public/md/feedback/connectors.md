# Connectors

Source: https://docs.shipeasy.ai/feedback/connectors

> Mirror new bug reports and feature requests out to a GitHub repo, a Google Sheet, or a Slack channel as they come in.

**Connectors** push every new bug report and feature request out to an external tool, so triage doesn't have to start in Shipeasy. Tickets themselves live on **Home**, the project's ops queue; a connector only mirrors them outward.

## Where each one is set up

There is no single Connectors screen in the dashboard. Each destination has the surface that fits it:

- **Slack** —
    **Connect Slack** authorizes the Shipeasy Slack app, then you pick a default channel. Posts a
    <b>message</b> per event, with action buttons, a <code>/shipeasy</code> command and an
    <b>@Shipeasy</b> assistant. <a href="/feedback/slack">Full Slack page →</a>

- **GitHub** — Opens an <b>Issue</b> (with labels) in a repository you pick for every selected event. Create the connector with the API, then finish the GitHub App install.

- **Google Sheets** — Appends a <b>row</b> to a spreadsheet and tab of your choice for every selected event.

- **Coding agents** — Claude, Cursor, Copilot and Jules connectors run an agent on your queue instead of mirroring it. See [Scheduled triggers](https://docs.shipeasy.ai/get-started/triggers).

These are the only destinations. Anything else is not available.

## Events you can forward

Each connector subscribes to one or more lifecycle events:

| Event                     | Fires when                      |
| ------------------------- | ------------------------------- |
| `bug.created`             | A bug is reported.              |
| `feature_request.created` | A feature request is submitted. |

By default both are selected.

## Setting up a GitHub or Google Sheets connector

Both are created through the connector API, which returns the connector switched off; the provider's
OAuth flow then attaches credentials and enables it.

**Create the connector**

[`POST /api/admin/connectors`](https://docs.shipeasy.ai/api/operations/createConnector) with `{ "provider": "github",
"name": "Bugs → acme/app", "events": ["bug.created"] }`. Use `"google_sheets"` for a sheet.

**Authorize the provider**

Complete the GitHub App install (pick which repos it can access) or the Google consent screen.

**Pick the target**

[Update the connector](https://docs.shipeasy.ai/api/operations/updateConnector) with the repository and optional **bug
labels** and **feature labels**, or the spreadsheet and tab, and set `enabled: true`.

**Check it**

[Send a test](https://docs.shipeasy.ai/api/operations/testConnector) — it opens a throwaway issue or appends a throwaway
row, so you can confirm the wiring.

## Setting up Slack

**Connect**
Open **Settings → Notifications** and click **Connect Slack**.

**Add to Slack**

Authorize the Shipeasy Slack app in your workspace. After consent you land back on the
Notifications tab.

**Pick a channel**

Choose the **default channel** for Slack notifications. Individual events can override it in the
events table below.

> **Slack does much more than mirror**

Posted messages carry **resolve / ready-for-QA** buttons, a **coloured status border**, platform
**notifications**, a **`/shipeasy`** slash command, and an **`@Shipeasy`** assistant that runs
your flags and configs by chat. It's all on the dedicated **[Slack page](https://docs.shipeasy.ai/feedback/slack)**.

## Status & health

[List the connectors](https://docs.shipeasy.ai/api/operations/listConnectors) to see each one's status — **Needs OAuth**, **Needs repo** / **Needs sheet** / **Needs channel** (target not picked yet), **Active**, **Disabled**, or **Failing** (last dispatch errored). The last error and last successful delivery time come back with it, so you can tell at a glance whether mirroring is healthy.

> **Connectors forward out — and Slack actions flow back**

The GitHub and Sheets connectors are one-way: new bugs/requests flow out, and status changes you
make there don't sync back. The Slack connector is the exception — its message buttons (resolve /
ready-for-QA, resolve / dismiss alert) write straight back into Shipeasy.

**Related**

- [Feedback overview](https://docs.shipeasy.ai/feedback/getting-started) — Where bugs and feature requests are captured.
- [Errors page](https://docs.shipeasy.ai/feedback/errors) — File an error as an issue, then mirror it via a connector.
- [Devtools overlay](https://docs.shipeasy.ai/feedback/devtools) — The in-page nub that captures bugs and requests.
