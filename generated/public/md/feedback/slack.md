# Slack

Source: https://docs.shipeasy.ai/feedback/slack

> Get alerts, errors, bugs and platform events in Slack on every plan — and on Pro and above, act on them from the card buttons, the /shipeasy command and the @Shipeasy assistant.

Slack is where Shipeasy comes to find you. Connect it **once** and bugs,
feature requests, alerts, error spikes and platform events post into your
channel as cards. That part works on **every plan**. On **Pro and above** the
same workspace connection also becomes a front-end: you act on the cards with
their buttons, run `/shipeasy`, and talk to **@Shipeasy** in plain language to
create and change flags, configs, killswitches, alerts and metrics without
opening the dashboard.

| What you do in Slack                                               | Plan          |
| ------------------------------------------------------------------ | ------------- |
| Receive bug, request, alert, error-spike and platform-event cards  | Every plan    |
| `File an issue` from an alert or error card · `Acknowledge` a card | Every plan    |
| Card actions — resolve, dismiss, mute, flip back, change status    | Pro and above |
| `/shipeasy` slash command                                          | Pro and above |
| Ask **@Shipeasy** to read or change your platform                  | Pro and above |

On a plan without the write half, a gated button stamps the card **Pro plan
required** and `@Shipeasy` replies with an upgrade note that also tells you what
still works — nothing is changed. The [pricing page](https://shipeasy.ai/pricing)
has the per-plan matrix.

## Connect Slack

**Connect**
Open **Settings → Notifications** and click **Connect Slack**.

**Add to Slack**

You're redirected to authorize the Shipeasy Slack app in your workspace. After consent you land
back on the Notifications tab.

**Pick a channel**

Choose the **default channel** for Slack notifications — new bugs, requests and platform events
post there. Individual events can override it in the events table on the same tab.

## Meet @Shipeasy — run the whole platform from chat

> **Pro and above**

Everything in this section, the card buttons below and `/shipeasy` are the write half of Slack,
included on Pro and above. Notifications and `File an issue` work on every plan.

Mention **@Shipeasy** in any channel it's in and ask for what you want. There's
nothing to memorise — no flags, no syntax. It understands plain language, **acts
as you** (your Slack identity is matched to your Shipeasy email, and you must be a
project member), and tells you exactly what it did.

It can do everything the dashboard assistant can — **read and change** your
entire platform:

| Ask @Shipeasy to…   | …and it will                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| **Feature flags**   | create a flag, roll it out to a %, choose who sees it, turn it on/off   |
| **Dynamic configs** | create a config, change what it returns                                 |
| **Killswitches**    | create one, flip it on or off                                           |
| **Alerts**          | tell you when a number gets too high or too low                         |
| **Metrics**         | start tracking something people do                                      |
| **Just ask**        | list what you have, check how a metric is moving, "what changed today?" |

### Create anything, just by asking

> No dashboard, no syntax — describe what you want and @Shipeasy creates it, acting as you. Each reply confirms exactly what happened.

It's just as good at **reading** and **changing** what already exists:

> what changed today?
> 📋 3 changes today: the new pricing page flag went to 50%, the payments killswitch was created, and the checkout copy config was published to prod.
> Ask questions too — @Shipeasy reads your flags, configs, killswitches and metrics and answers in the thread.

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

Flip a killswitch and the channel offers a one-click revert; publish a config to
prod and the change is announced with a link:

On Pro and above, every action writes straight back into Shipeasy, records an
audit entry, stamps who did it, and recolours the card. `Acknowledge` and
`File an issue` are the two that work on every plan. Here's the full set:

| Event                            | Card actions                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Alert triggered**              | `Resolve` · `Dismiss` · `Mute rule` (disables the rule that fired) · `File an issue` (any plan) |
| **Error spiking** (from `see()`) | `Resolve` · `Dismiss` · `Mute this error` (with a trend chart) · `File an issue` (any plan)     |
| **Killswitch flipped**           | `Flip back` (one-click revert)                                                                  |
| **Config published to prod**     | `Acknowledge`                                                                                   |
| **Agent needs your attention**   | `Open the issue ↗` · `Acknowledge`                                                              |
| Weekly digest · New team member  | _(informational — link only)_                                                                   |

Choose which of these post to Slack in **Settings → Notifications** (the Slack
column is live once Slack is connected).

> **Privileged actions check your membership**

Flipping a killswitch, publishing a config, and muting an alert rule go through the real admin
path (so the change propagates) and verify **you're a member of the project** first. If you're
not, only you see a quiet "ask an admin to invite you" — the shared card is untouched for everyone
else.

## Bugs & requests — the other inbound stream

New **bug reports** and **feature requests** post to your default channel with
the title, reporter, page URL and full details (every plan). On Pro and above
each carries a **Status ▾** dropdown covering the whole lifecycle.

| Status        | Border   |
| ------------- | -------- |
| Open          | 🔵 blue  |
| In progress   | 🟠 amber |
| Ready for QA  | 🟠 amber |
| Resolved      | 🟢 green |
| **Won't fix** | ⚪ grey  |

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

For a fast, no-chat shortcut (Pro and above), `/shipeasy` creates a metric alert from inside a
channel — the alert posts back to that channel, and the reply is private to you:

```text
/shipeasy alert <metric> <gt|gte|lt|lte> <threshold> [name]
```

For anything beyond a quick alert, just talk to **@Shipeasy**.

## Drive Shipeasy from Slack's AI

If you'd rather use **Slack's own AI assistant**, Shipeasy is also available there
as an MCP connection — the same flags, configs, killswitches, metrics and
ops queue. Your workspace admin enables it once under the Slack App's **MCP Server
Connection** (Slack identity auth); after that, ask Slack's assistant to manage
Shipeasy and it calls through to your project under the same membership check.

## Channel routing

- **Default channel** — where new bugs, requests and platform events post (**Settings → Notifications**).
- **Per-event channel** — any event in the events table can post somewhere else.
- **Per-alert channel** — an alert created in a specific channel posts back to that channel, overriding the project default.

## Status & health

**Settings → Notifications** shows whether Slack is connected. If posting stops, click
**Reconnect** there to re-authorize the workspace; it runs the same flow as **Connect Slack**.

> **The bot needs your email**

The `@Shipeasy` assistant, privileged card actions, the `/shipeasy` command, and the Slack-AI
connection resolve access by your Slack email, which needs the `users:read.email` scope. If you
connected Slack before this was added, click **Reconnect** on **Settings → Notifications** to
re-grant.

**Related**

- [Connectors overview](https://docs.shipeasy.ai/feedback/connectors) — GitHub and Google Sheets destinations alongside Slack.
- [Feedback overview](https://docs.shipeasy.ai/feedback/getting-started) — Where bugs and feature requests are captured.
- [Errors & alerts](https://docs.shipeasy.ai/feedback/errors) — What feeds the alert notifications you can resolve from Slack.
