# File a feedback ticket for an error

Source: https://docs.shipeasy.ai/api/operations/fileErrorTicket

> >-

Files a feedback ticket (`type: "error"`) for a tracked production error — the "File an issue" action on the errors dashboard. The ticket carries the error's fingerprint as its `sourceRef` so it dedupes against, and joins back to, the tracked error. Takes no body.

Idempotent: if an open `error` ticket already tracks this fingerprint (hand- or auto-filed), that existing ticket is returned instead of creating a duplicate. Returns `404` if the error does not exist.

**Use case:** Promote a noisy tracked error into an actionable ticket in the ops queue (the same item the worker auto-files once an error crosses its occurrence threshold), so it can be triaged, assigned, and burned down via the `shipeasy-ops-work` skill.
