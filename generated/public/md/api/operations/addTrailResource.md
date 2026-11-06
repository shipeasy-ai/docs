# Link a resource to a trail

Source: https://docs.shipeasy.ai/api/operations/addTrailResource

> >-

Omit `role` and it is guessed from the kind. The release gates and the release phase read these links. Linking the same entity again changes its role.

Writes made through the CLI or MCP while `SHIPEASY_TRAIL` is set link themselves; use this for anything else.

Safe for the restricted ops key.

**Use case:** The agent created the flag `checkout.v2` for the trail; it links it as `ships_behind`.
