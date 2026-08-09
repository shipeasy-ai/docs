# List config version history

Source: https://docs.shipeasy.ai/api/operations/listConfigVersions

> >-

Returns every published version of the config's value on one env, newest first. The `env` query parameter picks the environment (`dev`, `staging`, or `prod`) and defaults to `prod`; an unknown env returns `400`. The config's JSON Schema is config-level and not versioned — this is value history only.

**Use case:** Render the History timeline in the config detail pane (value diff + restore), or audit which value was live on prod at a given version.
