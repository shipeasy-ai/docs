# List a trail's plan revisions

Source: https://docs.shipeasy.ai/api/operations/listTrailPlanRevisions

> >-

Every approved revision of the trail's plan, newest first: the plan as it was approved, who approved it and when, and what changed since the revision before. A plan is revised by a `replan` run, which re-reads the goal metric, the items' outcomes and project memory and drafts the next revision; each approval adds one. The current plan, drafted or approved, is on `trails get`.

Safe for the restricted ops key.

**Use case:** Before replanning, a coding agent reads how the plan changed so far so the next revision does not undo a decision already made.
