# Run the review agents

Source: https://docs.shipeasy.ai/api/operations/requestOpsTrailReview

> >-

**Alias.** Kept for the v1 item routes: it resolves the item's trail and behaves exactly like `POST /api/admin/trails/{handle}/review`, answering `404` when the item is on no trail. Prefer the `/api/admin/trails` routes. Not part of the CLI or MCP surface.

Launch the project's review agents on a change's latest push now, instead of
waiting for the next push. Each agent's eval reads `pending` until its run
submits. Agents sharing a coding-agent trigger are reviewed in one run.
Review runs spend your own agent quota, not Shipeasy credits.

**Use case:** An agent's instructions changed and the latest push should be
re-scored.
