# Resume a trail's rollout

Source: https://docs.shipeasy.ai/api/operations/resumeTrailRollout

> >-

Hand a paused rollout back to the release controller. Pass `resource` (the flag's trail-resource id or its key) to resume one flag's rollout, or omit it to resume every paused flag on the trail. It reconciles with the flag wherever a person left it (the highest step at or below the flag's percent, snapping the flag onto that step), restarts the step's hold, and carries on. A rollout that was pulled back and is waiting for its fix resumes as `fixing`. Resuming a rollout that is not paused answers `409`.

Resuming is a person's call: it hands the flag back to automation. Only a dashboard session or a device-auth CLI session can resume — ops keys, project admin keys and OAuth MCP calls are refused with `403`. This operation is not exposed as an MCP tool.

**Use case:** After steering the flag by hand, give the ramp back to the controller.
