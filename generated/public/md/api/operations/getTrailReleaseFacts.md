# Read a trail's release facts

Source: https://docs.shipeasy.ai/api/operations/getTrailReleaseFacts

> >-

The traffic is read from `proxy` when given (`metric:<key>`, `event:<name>` or `flag:<key>`), else the trail's goal metric, else a flag already on the trail. With nothing to read the tier is `none` — pass an event on the surface the trail changes.

The plan run reads these before it asks how to ship, and `submit-plan` checks the plan against them. Read-only. Safe for the restricted ops key.
