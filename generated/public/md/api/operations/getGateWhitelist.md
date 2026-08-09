# Read a gate's whitelist

Source: https://docs.shipeasy.ai/api/operations/getGateWhitelist

> >-

Returns the gate's whitelist — the always-first allowlist that admits the listed identities before any targeting rule or percentage rollout is evaluated.

A gate with no whitelist returns `entries: []` (and the default `attr`), never a 404 — so a caller can read-then-write without special-casing the empty gate.

**Use case:** Check whether an account is already let through before adding it.
