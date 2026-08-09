# List killswitches

Source: https://docs.shipeasy.ai/api/operations/listKillswitches

> >-

Returns a single page of killswitches ordered by `updated_at desc, id desc`. Each row includes the latest published `value`/`switches`/`version` per env.

**Use case:** Snapshot every killswitch in the project — e.g. to render an incident-response runbook listing every kill and its current trip state.
