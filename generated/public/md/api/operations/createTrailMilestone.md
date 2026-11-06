# Add a milestone to a trail

Source: https://docs.shipeasy.ai/api/operations/createTrailMilestone

> >-

Add a named stage to the trail, with an optional description and target date. Milestones are ordered: omit `position` to add it last, or pass one to insert it there and move the rest down. Progress is counted per milestone, and the build works the trail milestone by milestone — it launches item runs for the first milestone that still has open items. Approving a plan creates the milestones its breakdown lists; use this for any added later.

Safe for the restricted ops key.

**Use case:** The trail's first release went out and a second stage came up in review; add a "Dead-letter view" milestone with its own target date.
