# Disable a gate

Source: https://docs.shipeasy.ai/api/operations/disableGate

> >-

Sets `enabled: false` so the gate evaluates to `false` for every caller, regardless of `rollout_pct` or `rules`. Use as a quick kill switch.

**Use case:** Flip a gate off in production without redeploying — the canonical kill-switch flow.
