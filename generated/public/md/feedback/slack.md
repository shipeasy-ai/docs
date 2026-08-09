# Slack

Source: https://docs.shipeasy.ai/feedback/slack

> Run your whole release platform from Slack by chatting with @Shipeasy — create gates, configs, kill switches, alerts and metrics in plain language, then act on everything as it streams back into the channel as interactive cards.

Slack is a full front-end to Shipeasy. Connect it **once**, then talk to
**@Shipeasy** in plain language to create and change anything — feature flags,
dynamic configs, kill switches, alerts, metrics — and watch it
all stream back into the channel as **interactive cards** you act on without ever
opening the dashboard. Bugs, requests and platform events land the same way.

## Connect Slack

**Add the connector**

On the **Feedback** page open **Connectors → New connector**, pick **Slack**, name it, and
**Continue**.

**Add to Slack**

You're redirected to authorize the Shipeasy Slack app in your workspace. After consent you land
back in the configure view.

**Pick channels**

Choose the **feedback channel** new bugs/requests post to. Optionally pick a separate
**notifications channel** for platform events — leave it on *Same as feedback channel* to share
one. Tick **Enabled** and **Save**.

## Meet @Shipeasy — run the whole platform from chat

Mention **@Shipeasy** in any channel it's in and ask for what you want. There's
nothing to memorise — no flags, no syntax. It understands plain language, **acts
as you** (your Slack identity is matched to your Shipeasy email, and you must be a
project member), and tells you exactly what it did.

It can do everything the dashboard assistant can — **read and change** your
entire platform:

| Ask @Shipeasy to…   | …and it will                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| **Feature flags**   | create a flag, roll it out to a %, choose who sees it, turn it on/off    |
| **Dynamic configs** | create a config, change what it returns                                  |
| **Kill switches**   | create one, flip it on or off                                            |
| **Alerts**          | tell you when a number gets too high or too low                          |
| **Metrics**         | start tracking something people do                                       |
| **Just ask**        | list what you have, check how a metric is moving, "what changed today?" |

### Create anything, just by asking

> No dashboard, no syntax — describe what you want and @Shipeasy creates it, acting as you. Each reply confirms exactly what happened.

It's just as good at **reading** and **changing** what already exists:

> which tests are showing a clear winner right now?
> 📊 2 of 4 have a clear winner: the new checkout (new version up 12%) and the pricing test (variant B up 6%). The other two need more data.
> Ask questions too — @Shipeasy reads your flags, tests, configs and metrics and answers in the thread.

> roll the new pricing page out to half of everyone
> ✅ The new pricing page is now live for 50% of users in prod.
> One sentence to change a rollout — the change goes live everywhere immediately.

> **It always acts as you**

@Shipeasy runs every action as **you** — your Slack identity → your Shipeasy email → a project
membership check. A non-member gets a quiet "ask an admin to invite you," never silent access.

## From chat to channel — what you set up comes back to you

The alert you just asked @Shipeasy to create doesn't disappear into a settings
page. When it **fires**, it posts into your channel as a card — and you control
its whole lifecycle right there.

Click **Resolve** and the same message is rewritten in place — buttons gone,
stamped with who acted, the border flipped to green. **Dismiss** leaves a distinct
grey, and **Mute rule** disables the rule that fired so it stops nagging.

When a specific error caught by [`see()`](https://docs.shipeasy.ai/feedback/error-reporting) starts
**spiking**, that lands too — with a little chart of the last hour so you can see
how bad it is at a glance, and the same resolve / dismiss / mute controls:

Flip a kill switch and the channel offers a one-click revert; publish a config to
prod and the change is announced with a link:

Every action writes straight back into Shipeasy, records an audit entry, stamps
who did it, and recolours the card. Here's the full set:

| Event                               | Card actions                                                       |
| ----------------------------------- | ------------------------------------------------------------------ |
| **Alert triggered**                 | `Resolve` · `Dismiss` · `Mute rule` (disables the rule that fired) |
| **Error spiking** (from `see()`)    | `Resolve` · `Dismiss` · `Mute this error` (with a trend chart)     |
| **Kill switch flipped**             | `Flip back` (one-click revert)                                     |
| **Config published to prod**        | `Acknowledge`                                                      |
| **Agent needs your attention**      | `Open the issue ↗` · `Acknowledge`                                 |
| Weekly digest · New team member     | _(informational — link only)_                                      |

Choose which of these post to Slack in **Settings → Notifications** (the Slack
column is live once a connector exists).

> **Privileged actions check your membership**

Flipping a kill switch, publishing a config, and muting an alert rule go through
the real admin path (so the change propagates) and verify **you're a member of the project**
first. If you're not, only you see a quiet "ask an admin to invite you" — the shared card is
untouched for everyone else.

## Bugs & requests — the other inbound stream

New **bug reports** and **feature requests** post to your feedback channel with
the title, reporter, page URL and full details. Each carries a **Status ▾**
dropdown covering the whole lifecycle.

| Status                  | Border   |
| ----------------------- | -------- |
| Open                    | 🔵 blue  |
| In progress             | 🟠 amber |
| Ready for QA            | 🟠 amber |
| Resolved                | 🟢 green |
| **Won't fix / Dismiss** | ⚪ grey  |

Pick one and the card recolours its **left border** to match — **Won't fix is a
distinct grey, never the green of Resolved**. Link a PR to the item in Shipeasy
and the same message is edited in place to show it:

…and when it's done, the card stamps who closed it and turns green:

## When an agent gets stuck — open the issue

Unattended agent runs (the ops loop burning down your queue) raise an **"Agent
needs your attention"** card when they're blocked. **Open the issue ↗** takes you
straight to the item it's stuck on — not a generic dashboard landing — where the
full escalation (the summary and the numbered steps the agent left) is shown in
context.

## Prefer a quick slash command?

For a fast, no-chat shortcut, `/shipeasy` creates a metric alert from inside a
channel — the alert posts back to that channel, and the reply is private to you:

```text
/shipeasy alert <metric> <gt|gte|lt|lte> <threshold> [name]
```

For anything beyond a quick alert, just talk to **@Shipeasy**.

## Drive Shipeasy from Slack's AI

If you'd rather use **Slack's own AI assistant**, Shipeasy is also available there
as an MCP connection — the same flags, configs, kill switches, metrics and
ops queue. Your workspace admin enables it once under the Slack App's **MCP Server
Connection** (Slack identity auth); after that, ask Slack's assistant to manage
Shipeasy and it calls through to your project under the same membership check.

## Channel routing

- **Feedback channel** — where new bugs and requests land.
- **Notifications channel** — where platform events post (defaults to the feedback channel).
- **Per-alert channel** — an alert created in a specific channel posts back to that channel, overriding the project default.

## Status & health

The connector in the list shows a status — **Needs OAuth**, **Needs channel**,
**Active**, **Disabled**, or **Failing** (last dispatch errored). The configure
view surfaces the last error and last successful delivery time, so you can tell at
a glance whether mirroring is healthy.

> **The bot needs your email**

The `@Shipeasy` assistant, privileged card actions, the `/shipeasy` command, and the Slack-AI
connection resolve access by your Slack email, which needs the `users:read.email` scope. If you
connected Slack before this was added, click **Add to Slack** again to re-grant.

**Related**

- [Connectors overview](https://docs.shipeasy.ai/feedback/connectors) — GitHub and Google Sheets destinations alongside Slack.
- [Feedback overview](https://docs.shipeasy.ai/feedback/getting-started) — Where bugs and feature requests are captured.
- [Errors & alerts](https://docs.shipeasy.ai/feedback/errors) — What feeds the alert notifications you can resolve from Slack.
