# Delete a killswitch

Source: https://docs.shipeasy.ai/api/operations/deleteKillswitch

> >-

Soft-deletes the killswitch and rebuilds the project's flags KV blob so SDKs stop seeing it.

**Use case:** Tear down a killswitch after the feature it protected has been removed.
