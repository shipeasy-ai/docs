# Submit a review agent's eval

Source: https://docs.shipeasy.ai/api/operations/submitOpsTrailEval

> >-

**Alias.** Kept for the v1 item routes: it resolves the item's trail and behaves exactly like `POST /api/admin/trails/{handle}/evals`, answering `404` when the item is on no trail. Prefer the `/api/admin/trails` routes. Not part of the CLI or MCP surface.

Record one review agent's result on one push of a change: a `value` (0–100
for a score agent, 1/0 for a boolean one), a short `rationale`, and any
`findings`.
threshold and polarity. Submitting again for the same push replaces the
earlier result and the open findings it raised.

The `agentKey` normally names a configured review agent; an unconfigured key
is recorded too, as a non-blocking score.

**Use case:** A review run fired on a push scores the diff for risk and
submits `{ agentKey: "risk", value: 35, rationale: "...", findings: [...] }`.
