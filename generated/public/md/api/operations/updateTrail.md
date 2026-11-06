# Change a trail

Source: https://docs.shipeasy.ai/api/operations/updateTrail

> >-

Change a trail's title, intent, type, priority, owner (the lead), repo scope, start and target dates, health, goal or autopilot. Pass at least one field; the rest are left as they are. Changing the type changes which release gates apply.

**Health.** `health` sets it by hand and it holds until changed; `health: null` goes back to the derived value (off track past the target date or while a rollout is fixing, at risk near the target with progress under 75 % or with a high finding or item open, otherwise on track).

**Autopilot.** `autopilot: { enabled, limits }` turns autopilot on or off and sets its limits. Turning it on needs the `autopilot` capability and a person's identity, and makes the caller the accountable approver (`403` otherwise). Turning it off is open to the trail's owner, the person who authorized it and admins.

**Use case:** The acceptance criteria changed after a review — update the body so the next agent run builds the right thing.
