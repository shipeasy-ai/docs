# Approve a change

Source: https://docs.shipeasy.ai/api/operations/approveTrail

> >-

Approve a change at its latest push — what the Human review gate counts. Approving the same push twice is a no-op. When the project's gates reset approvals on push, a later push needs a fresh approval. Unless the gates allow `authorCanApprove`, the trail's owner and whoever started its runs do not count.

Approval is a person's call. Only a dashboard session or a device-auth CLI session can approve — ops keys, project admin keys and OAuth MCP calls are refused with `403`. This operation is not exposed as an MCP tool.

**Use case:** A reviewer has read the evals and the diff and signs off.
