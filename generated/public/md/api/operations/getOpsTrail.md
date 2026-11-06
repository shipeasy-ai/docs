# Show an item's trail

Source: https://docs.shipeasy.ai/api/operations/getOpsTrail

> >-

**Alias.** Kept for the v1 item routes: it resolves the item's trail and behaves exactly like `GET /api/admin/trails/{handle}`, answering `404` when the item is on no trail. Prefer the `/api/admin/trails` routes. Not part of the CLI or MCP surface.

The item's trail, followed from intent to release: its phase, and for every
pull request (each a *change*) the latest push, the merge gates and how they read,
CI checks, each review agent's eval on the latest push next to its last five,
every finding (open first, worst first, `stale` when raised on an earlier
push), the approvals, and the pushes.

Gates are read live from GitHub on every call, so a `state` of `unknown` means
GitHub could not be read and the PR-backed gates read `pending`.

**Use case:** After pushing a fix, a coding agent reads the trail to see which
findings are still open and whether the scores have turned green.
