# Submit a review agent's eval

Source: https://docs.shipeasy.ai/api/operations/submitTrailEval

> >-

Record one review agent's result on one push of a change: a `value` (0–100 for a score agent, 1/0 for a boolean one), a short `rationale`, and any `findings`. Submitting again for the same push replaces the earlier result and the open findings it raised. `prUrl` selects the change; omitted, the trail's primary change.

They are linked to the trail as detected, and a key that does not exist yet becomes a finding.

The `agentKey` normally names a configured review agent; an unconfigured key is recorded too, as a non-blocking score.

Safe for the restricted ops key.

**Use case:** A review run fired on a push scores the diff for risk and submits `{ agentKey: "risk", value: 35, rationale: "...", findings: [...] }`.
