# Resume a trail's autopilot

Source: https://docs.shipeasy.ai/api/operations/resumeTrailAutopilot

> >-

Hand a paused autopilot back to automation. The caller becomes the accountable approver: what autopilot approves and merges from here is recorded as authorized by them, so resuming needs the `autopilot` capability (admins have it). Resuming an autopilot that is not paused answers `409`.

Resuming is a person's call: only a dashboard session or a device-auth CLI session can resume — ops keys, project admin keys and OAuth MCP calls are refused with `403`. This operation is not exposed as an MCP tool.

**Use case:** The risk limit was too tight for a small change; raise it and give the trail back to autopilot.
