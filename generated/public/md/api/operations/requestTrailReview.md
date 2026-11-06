# Run the review agents

Source: https://docs.shipeasy.ai/api/operations/requestTrailReview

> >-

Launch the project's review agents on a change's latest push now, instead of waiting for the next push. Each agent's eval reads `pending` until its run submits. Agents sharing a coding-agent trigger are reviewed in one run. Review runs spend your own agent quota, not Shipeasy credits.

Safe for the restricted ops key.

**Use case:** An agent's instructions changed and the latest push should be re-scored.
