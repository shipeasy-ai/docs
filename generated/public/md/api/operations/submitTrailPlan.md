# Submit a trail's plan

Source: https://docs.shipeasy.ai/api/operations/submitTrailPlan

> >-

A plan run submits what it worked out: the plan in markdown, the `release` block (how the trail ships, why, and the exact flags, kill switches and tracking — events, metrics, alert rules — the build will create; no release tool for `straight_to_main`), the `breakdown` (the milestones and the items, each with its work kind and assignee) and the `sources` it rests on (what it read in project memory and earlier tickets, and what each settled). Submit it only after the person has answered the release question you asked with `ops questions ask`. The plan is recorded as `drafted` and waits for a person to approve it; nothing in the breakdown is filed until then. Submitting again replaces a drafted plan; an approved plan is refused with `409` (a person edits it to reopen it), except from a `replan` run, whose submission drafts the next revision with a `summary` of what changed. The open plan or replan run on the trail is closed.

The plan is checked against the trail's release facts (`trails release-facts`). On an autopilot trail any warning pauses autopilot and hands the plan to its owner.

Safe for the restricted ops key.

**Use case:** The person picked "behind a flag"; the plan run submits the plan listing the flag `checkout.v2`, bucketed by user with a team stage first, and the risk its error-rate alert guards.
