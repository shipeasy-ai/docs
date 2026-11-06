# Merge a change

Source: https://docs.shipeasy.ai/api/operations/mergeOpsTrail

> >-

**Alias.** Kept for the v1 item routes: it resolves the item's trail and behaves exactly like `POST /api/admin/trails/{handle}/merge`, answering `404` when the item is on no trail. Prefer the `/api/admin/trails` routes. Not part of the CLI or MCP surface.

Merge a change's pull request on GitHub at the head its gates were evaluated
on. Refused with `409` while a blocking gate has not passed, unless `bypass`
is set with a `reason` — the bypass is recorded on the trail. GitHub's own
branch rules can still refuse the merge (`502`). Merging one change never
merges the trail's other changes.

Merging is a person's call: only a dashboard or device-auth session can merge.

**Use case:** Every gate is green; merge from the trail instead of switching
to GitHub.
