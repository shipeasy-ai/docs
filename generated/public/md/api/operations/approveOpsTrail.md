# Approve a change

Source: https://docs.shipeasy.ai/api/operations/approveOpsTrail

> >-

**Alias.** Kept for the v1 item routes: it resolves the item's trail and behaves exactly like `POST /api/admin/trails/{handle}/approve`, answering `404` when the item is on no trail. Prefer the `/api/admin/trails` routes. Not part of the CLI or MCP surface.

Approve a change at its latest push — what the Human review gate counts.
Approving the same push twice is a no-op. When the project's gates reset
approvals on push, a later push needs a fresh approval.

Approval is a person's call: only a dashboard or device-auth session can approve.

**Use case:** A reviewer has read the evals and the diff and signs off.
