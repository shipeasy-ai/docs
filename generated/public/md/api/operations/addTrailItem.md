# Put an existing item on a trail

Source: https://docs.shipeasy.ai/api/operations/addTrailItem

> >-

Attach an existing queue item to the trail, recorded with source `attached`, optionally into a milestone (`milestoneId`). An item is on at most one trail; one already on another trail is refused with `409`. To file a *new* item on a trail, use `ops bug --trail` or `ops feature --trail`.

Safe for the restricted ops key.

**Use case:** A bug already in the queue turns out to be part of the work; attach it so the trail tracks it.
