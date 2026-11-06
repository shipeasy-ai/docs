# Approve a trail's plan

Source: https://docs.shipeasy.ai/api/operations/approveTrailPlan

> >-

Sign off the drafted plan. Approving creates the breakdown's milestones and files its items on the trail with source `plan`, in one batch (`itemsFiled` counts them); approving a replan files only the breakdown items not already on the trail, matched by title, and records a new revision. The build then works the items milestone by milestone, one item run each. A plan without items keeps the old shape: one trail-level build run builds it. Either way the build creates exactly the resources the plan lists and links them to the trail, and the Plan gate checks they exist. With `startBuild` the build is fired in the same call.

Approval is a person's call. Only a dashboard session or a device-auth CLI session can approve — ops keys, project admin keys and OAuth MCP calls are refused with `403`. This operation is not exposed as an MCP tool.

**Use case:** The plan lists the flag and the kill switch the person asked for; approve it and start the build.
