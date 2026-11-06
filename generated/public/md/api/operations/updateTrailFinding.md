# Resolve or dismiss a finding

Source: https://docs.shipeasy.ai/api/operations/updateTrailFinding

> >-

Set a finding's status — `resolved` (it was fixed; say how in `reason`), `dismissed` (it is not a problem; say why), or back to `open`. A finding that is real but out of scope is not dismissed: promote it with `trails promote-finding`.

Safe for the restricted ops key.

**Use case:** The coding agent fixed a flagged issue, pushed, and resolves the finding with `reason: "fixed in abc1234"`.
