# Remove one switch entry

Source: https://docs.shipeasy.ai/api/operations/unsetKillswitchSwitch

> >-

Removes a single `switchKey` from the `switches` map on a single `env`. Publishes a new version on that env.

Returns `{ removed: false }` if the entry didn't exist (idempotent no-op).

**Use case:** Clean up a per-region override after the incident is resolved so the flat `value` governs again.
