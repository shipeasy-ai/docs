# Approve a pending event

Source: https://docs.shipeasy.ai/api/operations/approveEvent

> >-

Promotes a pending (auto-discovered) event to usable so metrics can query it (`pending` → `0`).

You may optionally declare the event's folder, description, or properties in the same call — the body is the same shape as update, and may be empty.

**Use case:** Clear an auto-discovered event out of the pending queue so metrics defined on it start resolving.
