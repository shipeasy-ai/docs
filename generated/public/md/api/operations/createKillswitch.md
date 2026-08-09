# Create a killswitch

Source: https://docs.shipeasy.ai/api/operations/createKillswitch

> >-

Creates a new killswitch with `value` (default `false`) applied to **every** env at version 1.

Returns `409` if `name` already exists in the project.

**Use cases**

- **Untripped create** — `{ "name": "payments.checkout" }`. Provision the kill ahead of an incident.
- **Pre-tripped** — `{ "value": true }` to ship the killswitch already engaged.
- **With switches** — seed `switches` to carve out per-region/per-tenant kills from day one.
