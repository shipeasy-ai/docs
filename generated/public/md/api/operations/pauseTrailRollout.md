# Pause a trail's rollout

Source: https://docs.shipeasy.ai/api/operations/pauseTrailRollout

> >-

Pause the release controller on a trail: it stops stepping the flag and watching the guards until the rollout is resumed. The flag stays wherever it is. A trail that ships behind several flags has a rollout per flag; pass `resource` (the flag's trail-resource id or its key) to pause one, or omit it to pause every flag. Any manual change to the flag pauses the controller the same way, so a person and the controller never fight over it. Safe to call at any time; pausing a rollout that is not running answers `409`.

Safe for the restricted ops key.

**Use case:** The checkout flag is at 25% and a deploy is going out; hold the ramp until it is done.
