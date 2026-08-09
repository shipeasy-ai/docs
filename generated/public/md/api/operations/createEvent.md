# Register an event

Source: https://docs.shipeasy.ai/api/operations/createEvent

> >-

Registers a new event name and (optionally) its typed properties. Only `name` is required.

If the name matches an existing **pending** (auto-discovered) row, this approves that row instead of returning a conflict. Otherwise an already-registered name returns `409`.

**Use cases**

- **Register a known event** — `{ "name": "checkout_completed" }` so metrics can reference it.
- **Declare typed properties** — supply `properties` to document the event's payload shape.
