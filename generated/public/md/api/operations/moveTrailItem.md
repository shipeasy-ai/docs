# Move an item to a milestone

Source: https://docs.shipeasy.ai/api/operations/moveTrailItem

> >-

Move an item on the trail into a milestone, or out of every milestone with `milestoneId: null`. The item stays on the trail and keeps its discovery record; only the milestone it counts toward changes. An item that is not on the trail is `404`, and so is a milestone of another trail.

Safe for the restricted ops key.

**Use case:** A bug filed on the trail turns out to block the first milestone; move it there so the build works it with the rest of that milestone.
