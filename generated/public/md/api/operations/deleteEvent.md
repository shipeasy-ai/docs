# Archive an event

Source: https://docs.shipeasy.ai/api/operations/deleteEvent

> >-

Soft-deletes (archives) the event. Returns `409` if any metric still references it — delete those metrics first.

**Use case:** Retire an event from the catalog once no metric depends on it.
