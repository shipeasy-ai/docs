# Project settings & modules

Source: https://docs.shipeasy.ai/get-started/modules

> Toggle which Shipeasy modules a project exposes, and manage notifications, billing, ownership, and deletion.

Everything about a project — its name, team, which features it exposes, notifications, billing, and the danger zone — lives under **Settings** (`/dashboard/<projectId>/settings`). The page has a left nav rail with these tabs: **General**, **Team**, **Organization** (Enterprise SSO), **Modules**, **Ops**, **Notifications**, **Triggers**, **Integrations**, **Billing**, and **Danger zone**. A few tabs only appear when the feature behind them is available to your workspace.

## Modules

The **Modules** tab is a list of switches, one per module, that decide which surfaces Shipeasy exposes for this project in the [devtools overlay](https://docs.shipeasy.ai/sdks/devtools-overlay) and the admin tabs. Turning a module off hides its surface; it doesn't delete data, and turning it back on brings everything back as it was.

The modules you will see, in the order the tab lists them:

| Switch                      | What it controls                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| **User**                    | Devtools tab for inspecting and overriding the current SDK user — props, locale, identifiers. |
| **Gatekeepers**             | Feature flags with targeting rules and percentage rollouts.                                   |
| **Configs**                 | Per-environment JSON config values published to your SDK clients.                             |
| **Bugs & feature requests** | In-app bug reports and feature requests captured via the devtools overlay.                    |
| **Events**                  | Live SDK event stream (evaluations, overrides) shown in the devtools overlay.                 |

Your tab can list more switches than this table — modules for products that are rolling out gradually appear only once they are available to your workspace, and work the same way. Kill switches, metrics, alerts and the ops queue are always on; they have no module switch.

> **Modules are per project**

Each project chooses its own module set, so a flags-only project and a bug-intake-only project can
live in the same workspace without clutter.

## General

The **General** tab sets the project **name**, **default environment** (`dev` / `staging` / `prod`), **timezone**, and an optional **domain** and **logo**. The default environment is the one the dashboard assumes when an environment isn't specified.

## Notifications

The **Notifications** tab manages per-event notification preferences for the project, and is where you connect Slack — see [Slack](https://docs.shipeasy.ai/feedback/slack) for what the connection does on each plan.

## Billing & plan limits

The **Billing** tab is the whole billing surface: subscription status, upgrade/downgrade, billing interval, assistant credit top-ups, and your current plan's live limits (flags, configs, kill switches, metrics, alert rules, SDK keys, poll interval) with usage against each. It is authoritative — the docs deliberately state no caps or prices; the [pricing page](https://shipeasy.ai/pricing) has the per-plan matrix.

## Danger zone

The **Danger** tab holds the two irreversible, owner-only actions:

> **Owner-only and irreversible**

Both actions require you to be the project owner and ask you to confirm the project name.

- **Transfer ownership** — move the project to a different admin, who gains full control. You pick the new owner from the existing active members.
- **Delete project** — removes all gates, configs, kill switches, metrics, and audit logs after a **14-day grace period**.

**Related**

- [Team & permissions](https://docs.shipeasy.ai/get-started/team) — Roles and who can change settings.
- [Pricing](https://shipeasy.ai/pricing) — Every plan-level cap.
- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — What the default environment drives.
