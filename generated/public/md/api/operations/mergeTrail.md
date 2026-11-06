# Merge a change

Source: https://docs.shipeasy.ai/api/operations/mergeTrail

> >-

Merge a change's pull request on GitHub at the head its gates were evaluated on. Refused with `409` while a blocking gate has not passed, unless `bypass` is set with a `reason` — bypass needs the bypass capability, and is audited and posted on the trail. GitHub's own branch rules can still refuse the merge (`502`). Merging one change never merges the trail's other changes; when the last open change merges the trail moves to `releasing`.

Merging is a person's call. Only a dashboard session or a device-auth CLI session can merge — ops keys, project admin keys and OAuth MCP calls are refused with `403`. This operation is not exposed as an MCP tool.

**Use case:** Every gate is green; merge from the trail instead of switching to GitHub.
