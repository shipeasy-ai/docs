# Connectors

Source: https://docs.shipeasy.ai/feedback/connectors

> Mirror new bug reports and feature requests out to a GitHub repo, a Google Sheet, or a Slack channel as they come in.

**Connectors** push every new bug report and feature request out to an external tool, so triage doesn't have to start in Shipeasy. Open them from the **Connectors** button on the **Feedback** page (`/dashboard/<projectId>/feedback`).

## Which destinations are wired

Three outbound destinations ship today:

- **GitHub** — Opens an <b>Issue</b> (with labels) in a repository you pick for every selected event.

- **Google Sheets** — Appends a <b>row</b> to a spreadsheet + tab of your choice for every selected event.

- **Slack** — Posts a <b>message</b> to a channel you pick — plus action buttons, notifications, a <code>/shipeasy</code> command and an <b>@Shipeasy</b> assistant. <a href="/feedback/slack">Full Slack page →</a>

> **Want Linear, Jira, Notion…?**

Those aren't wired yet. The connectors panel has a **"Need a connector we don't have yet?"**
banner — tell us where you want bugs and requests to land and it goes straight to the Shipeasy
team as a feature request. Until then, GitHub, Google Sheets and Slack are the providers
available.

## Events you can forward

Each connector subscribes to one or more lifecycle events:

| Event                     | Fires when                      |
| ------------------------- | ------------------------------- |
| `bug.created`             | A bug is reported.              |
| `feature_request.created` | A feature request is submitted. |

By default both are selected.

## Setting up a GitHub connector

**Create the connector**

**Connectors → New connector**, pick **GitHub**, name it, choose the events to forward, and
**Continue**.

**Install the GitHub App**

You're redirected to install the Shipeasy GitHub App and pick which repos it can access. After
consent you land back in the configure view.

**Pick a repo and labels**

Select the **repository**, optionally set **bug labels** and **feature labels**
(comma-separated) to apply to opened issues, tick **Enabled**, and **Save**. Use **Send test**
to open a throwaway issue and confirm the wiring.

## Setting up a Google Sheets connector

**Create the connector**

**Connectors → New connector**, pick **Google Sheets**, name it, choose events, and
**Continue**.

**Authorize Google**

Authorize Shipeasy to access your Drive. After consent you come back to configure.

**Pick a spreadsheet and tab**

Choose the **spreadsheet** and **tab** to append rows to, tick **Enabled**, and **Save**.

## Setting up a Slack connector

**Create the connector**

**Connectors → New connector**, pick **Slack**, name it, choose events, and **Continue**.

**Add to Slack**

You're redirected to authorize the Shipeasy Slack app in your workspace. After consent you land
back in the configure view.

**Pick a channel**

Choose the **feedback channel** new bugs/requests post to. Optionally pick a separate
**notifications channel** for platform events (alerts, errors, config publishes) — leave it on
*Same as feedback channel* to share one. Tick **Enabled**, **Save**, and use **Send test** to
post a throwaway message.

> **Slack does much more than mirror**

Posted messages carry **resolve / ready-for-QA** buttons, a **coloured status border**, platform
**notifications**, a **`/shipeasy`** slash command, and an **`@Shipeasy`** assistant that runs
your flags and configs by chat. It's all on the dedicated **[Slack page](https://docs.shipeasy.ai/feedback/slack)**.

## Status & health

Each connector in the list shows a status — **Needs OAuth**, **Needs repo** / **Needs sheet** / **Needs channel** (target not picked yet), **Active**, **Disabled**, or **Failing** (last dispatch errored). The configure view surfaces the last error and last successful delivery time, so you can tell at a glance whether mirroring is healthy.

> **Connectors forward out — and Slack actions flow back**

The GitHub and Sheets connectors are one-way: new bugs/requests flow out, and status changes you
make there don't sync back. The Slack connector is the exception — its message buttons (resolve /
ready-for-QA, resolve / dismiss alert) write straight back into Shipeasy.

**Related**

- [Feedback overview](https://docs.shipeasy.ai/feedback/getting-started) — Where bugs and feature requests are captured.
- [Errors dashboard & triage](https://docs.shipeasy.ai/feedback/errors) — File an error as an issue, then mirror it via a connector.
- [Devtools overlay](https://docs.shipeasy.ai/feedback/devtools) — The in-page nub that captures bugs and requests.
