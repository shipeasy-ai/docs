# Promote a finding to a queue item

Source: https://docs.shipeasy.ai/api/operations/promoteTrailFinding

> >-

Move a finding that is real but out of scope onto the queue. It creates a bug (or a feature request, with `type`) whose description quotes the finding, its path and line, and its push. The new item lands on the trail with source `finding`, and the finding is dismissed as `moved to #N` so the gates stop counting it. Promotion is the one-way bridge from a finding (per push, in scope, must be dealt with before merge) to an item (lives on its own, can become its own trail).

Safe for the restricted ops key.

**Use case:** A review flags a flaky test unrelated to the change; the coding agent promotes it instead of drive-by fixing it.
