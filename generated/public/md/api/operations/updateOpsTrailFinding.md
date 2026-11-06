# Resolve or dismiss a finding

Source: https://docs.shipeasy.ai/api/operations/updateOpsTrailFinding

> >-

**Alias.** Kept for the v1 item routes: it resolves the item's trail and behaves exactly like `PATCH /api/admin/trails/{handle}/findings/{findingId}`, answering `404` when the item is on no trail. Prefer the `/api/admin/trails` routes. Not part of the CLI or MCP surface.

Set a finding's status — `resolved` (it was fixed; say how in `reason`),
`dismissed` (it is not a problem; say why), or back to `open`.

**Use case:** The coding agent fixed a flagged issue, pushed, and resolves the
finding with `reason: "fixed in abc1234"`.
