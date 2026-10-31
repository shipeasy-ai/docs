# Team & permissions

Source: https://docs.shipeasy.ai/get-started/team

> Invite teammates to a project, assign roles, grant extra permissions, and cap Jarvis usage per person.

Each project has its own roster. Open **Team** in the dashboard (`/dashboard/<projectId>/team`) to see members, pending invites, and what each role can do.

## Roles

Membership is role-based, with optional per-member grants on top. There are three roles:

| Role       | What they can do                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**  | Full control. Manage members, billing, API keys and automation. Trigger agents and use Jarvis.                                                                      |
| **Editor** | Create and edit flags, configs, killswitches, metrics, events, translations, alerts and ops items. Trigger agents and use Jarvis. Cannot manage members, keys, billing or automation. |
| **Viewer** | Read-only. Sees everything, and can still file, comment on and answer questions on ops items.                                                                       |

Roles are enforced on every write — from the dashboard, the CLI, MCP and Slack alike. A request your role doesn't allow is refused with a `403` that names what it needs.

### Permission grants

A role can be widened per member without changing the role itself. On the **Team** tab, open a member's **Permissions** (the sliders icon on their row) and switch on any of:

| Grant                    | Lets the member                                               |
| ------------------------ | ------------------------------------------------------------- |
| **Trigger agents**       | Hand an ops item to a coding agent, or stop its run.          |
| **Use Jarvis**           | Chat with Jarvis and mention `@shipeasy` in comments.         |
| **Configure automation** | Manage connectors, routing rules, webhooks and Slack subscriptions. |
| **Manage billing**       | Change the plan, payment method and credits.                  |

A grant only ever adds — a capability the member's role already includes shows as checked and locked. The owner or an admin can edit grants.

### Jarvis token budget

In the same dialog, set a **Jarvis token budget per month** to cap one member's Jarvis usage. It counts input plus output tokens from the 1st of each month (UTC); once it is spent, Jarvis declines that member's chats and doesn't answer their `@shipeasy` mentions until the month rolls over or an admin raises the budget. Leave it empty for no personal limit — the project's credit balance still applies.

The **owner** of the project is always an admin and can't be removed without first transferring ownership (see [Project settings → Danger zone](https://docs.shipeasy.ai/get-started/modules#danger-zone)).

## Inviting members

**Open the invite dialog**

On the **Team** page, click **Invite people**. Only the workspace owner or an admin can invite —
for everyone else the button is disabled.

**Add emails**

Type an email and press **Enter** or comma to add it as a chip; paste a list to bulk-invite.
Pick a **default role** (Editor by default) that applies to everyone in this batch.

**Send**

Leave **Send email notification** checked to email each invitee. They sign in with the same
providers as your workspace — GitHub, Google, or magic link — and land in the project once they
accept.

> **Invites stay pending until accepted**

A freshly-invited member shows as **pending** on the roster with who invited them. Use **Resend
invite** from the row if the email got lost. Once they sign in, the row flips to active.

## Managing members

From the members table:

- **Change a role** — pick a new role from the per-row role dropdown. Role changes are owner-only.
- **Edit permissions** — grant capabilities or set a Jarvis token budget. Owner or admin.
- **Resend an invite** — re-send the email for a pending member.
- **Remove a member** — revoke their access to the project. Removal is owner-only.

## Seats

Seats are **not** metered — invite the whole team on any plan, including Free. Nothing on the roster counts against a quota or adds to the bill.

**Related**

- [Pricing](https://shipeasy.ai/pricing) — What each plan includes.
- [Project settings & modules](https://docs.shipeasy.ai/get-started/modules) — Transfer ownership, delete a project, toggle modules.
- [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) — How sign-in and sessions work.
