# Read a trail's timeline

Source: https://docs.shipeasy.ai/api/operations/getTrailTimeline

> >-

Everything that happened on the trail, newest first: created, plans approved, questions asked and answered (on the trail and on its items), runs, items filed and done, pull requests opened, approved and merged, every rollout step, pull-back and autopilot action, the goal watched and met or missed, errors attributed. Each event says whether it was a **decision** — a choice a person (or autopilot on a person's authority) made — and a decided question carries every option it offered and which one was picked.

Pass `decisions=true` for the decisions only. Page with `before` (the `next` of the previous page).

Safe for the restricted ops key.

**Use case:** Before re-planning, an agent reads what was tried and decided on the trail so the next revision does not repeat it.
