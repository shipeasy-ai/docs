# Update a killswitch

Source: https://docs.shipeasy.ai/api/operations/updateKillswitch

> >-

Partial update applied to **every** env. Setting `value`/`switches` publishes a new version per env. Description-only patches don't bump versions.

To change a single switch on a single env, use `PUT /{id}/switch` instead.

**Use cases**

- **Trip everywhere** — `{ "value": true }`. Kills the feature across dev/stage/prod in one call.
- **Untrip everywhere** — `{ "value": false }`.
- **Replace switches** — send the full new map; per-key edits use `PUT /{id}/switch`.
- **Update description** — metadata-only patches don't bump versions.
