# Save a draft value

Source: https://docs.shipeasy.ai/api/operations/saveConfigDraft

> >-

Stages a value for one env without publishing. The draft is validated against the config's current schema and stored alongside the `baseVersion` it was forked from.

Saving over an existing draft overwrites it. Use `POST /{id}/publish` to promote it to a new published version.

**Use case:** Iterate on a config value on dev without affecting prod — preview in staging, then publish.
