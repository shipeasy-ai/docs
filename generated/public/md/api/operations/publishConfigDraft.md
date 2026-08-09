# Publish a draft

Source: https://docs.shipeasy.ai/api/operations/publishConfigDraft

> >-

Promotes the staged draft on one env to a new published version. The draft must still validate against the current schema.

Returns `404` if there is no draft for the given env.

**Use case:** Ship a staged change once you've validated it on a lower env.
