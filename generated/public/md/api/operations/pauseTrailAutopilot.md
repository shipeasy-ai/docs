# Pause a trail's autopilot

Source: https://docs.shipeasy.ai/api/operations/pauseTrailAutopilot

> >-

Stop autopilot on a trail: it answers no more plan questions, approves no plan and merges nothing until a person resumes it. Whatever it already merged or ramped stays; the release controller keeps its own breach policy. Safe to call at any time, and for anyone who can write to the trail; pausing an autopilot that is not on answers `409`.

Safe for the restricted ops key.

**Use case:** A deploy freeze starts at 5pm; stop the trail from auto-merging until it is over.
