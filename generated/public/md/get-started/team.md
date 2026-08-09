# Team & permissions

Source: https://docs.shipeasy.ai/get-started/team

> Invite teammates to a project, assign roles, and control who can publish to production.

Each project has its own roster. Open **Team** in the dashboard (`/dashboard/<projectId>/team`) to see members, pending invites, and what each role can do.

## Roles

Membership is role-based. There are three roles:

| Role       | What they can do                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Admin**  | Full control. Manage members, billing, and API keys. Publish to production.                                              |
| **Editor** | Create and edit feature flags, configs, and kill switches. Promote to staging. Cannot publish to prod or invite members. |
| **Viewer** | Read-only. See dashboards, metrics, and the ops queue. Useful for stakeholders.                                          |

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
- **Resend an invite** — re-send the email for a pending member.
- **Remove a member** — revoke their access to the project. Removal is owner-only.

## Seats

Seats are **not** metered — invite the whole team on any plan, including Free. Nothing on the roster counts against a quota or adds to the bill.

**Related**

- [Pricing](https://shipeasy.ai/pricing) — What each plan includes.
- [Project settings & modules](https://docs.shipeasy.ai/get-started/modules) — Transfer ownership, delete a project, toggle modules.
- [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) — How sign-in and sessions work.
