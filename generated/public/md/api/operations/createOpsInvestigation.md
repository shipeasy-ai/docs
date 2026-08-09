# Record an investigation

Source: https://docs.shipeasy.ai/api/operations/createOpsInvestigation

> >-

Append one structured investigation record to a queue item — the AI-write
seam the cockpit's detail panel renders read-only. Post your findings
(`kind: investigated`), a blocking question for the team (`kind:
question`), or how to verify the fix (`kind: ready_for_qa` with
`qaNotes`). Append-only and create-only, so it is safe for restricted ops
keys.

**Use case:** After working an item, leave a findings write-up (summary,
markdown findings, sources inspected, confidence) so the team — and the
next agent run — sees what you learned.
