# Create a trail

Source: https://docs.shipeasy.ai/api/operations/createTrail

> >-

Creates a trail in `planning`. A trail is created on purpose — nothing makes one implicitly. Create one from scratch with a `title` and a `body` (the outcome and the acceptance criteria), or press **Ship this** on a queue item with `originItem`: the item's description seeds the body and the item becomes the trail's first item, with source `origin`. An item is on at most one trail.

A trail may carry a `goal` (the metric it is meant to move, with a baseline and a target), a `startDate` and a `targetDate`, and a `health` set by hand (omitted, it is derived).

Fire the project's coding agent on the new trail with `trails start`, or link pull requests an agent already opened with `trails link-pr`.

**Autopilot.** `autopilot: { enabled: true, limits }` turns on autopilot at creation: the plan's questions are answered with the agent's recommendation, the plan is approved, and the change merges when every blocking gate is green, all inside the limits. It needs the `autopilot` capability and a person's identity (a dashboard session or a signed-in CLI); an ops key, an admin key or MCP asking for it is refused with `403`. Everything else is safe for the restricted ops key.

**Use case:** A coding agent that was asked to ship a multi-part feature opens one trail for it, then links every PR it opens.
