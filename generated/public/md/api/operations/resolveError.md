# Resolve a tracked error

Source: https://docs.shipeasy.ai/api/operations/resolveError

> >-

Marks one tracked error `resolved` — the single-purpose "close out" action. Takes no body; it is `PATCH /api/admin/errors/{id}` pinned to `{ "status": "resolved" }`, exposed so tooling can close an error without being handed the full open/resolved/ignored status machine. A resolved error reopens automatically (ingestion-side) if it recurs, so resolving is always safe: a premature resolve un-does itself on the next occurrence. Returns the updated row; `404` if the error does not exist.

**Use case:** Close out a tracked error from an agent or script once its fix has shipped — e.g. after a deploy, resolve every open issue the change addressed and let recurrence reopen anything that wasn't actually fixed.
