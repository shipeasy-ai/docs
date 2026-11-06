# Ask the team questions about an item

Source: https://docs.shipeasy.ai/api/operations/askOpsQuestions

> >-

Ask 1–4 structured questions about a queue item — the way to get a
decision from a person when the implementation needs one. Each question
is the `AskUserQuestion` shape: a short `header` chip, the full
`question`, 2–4 `options` (`label` + `description`), and `multiSelect`
(checkboxes instead of radios). The person can always answer "Other" in
free text, so never add an "Other" option yourself. The questions render
at the very top of the item's detail panel and mark the row in the queue.

**Delivery.** `resume` re-fires your trigger-connector run on the item
once every question it asked is answered, continuing the same run record
with the answers in the prompt — stop after asking. `poll` fires nothing;
poll `GET .../questions` instead. Omitted, it is `resume` when `runId`
names a run launched through a trigger connector, else `poll`.

**On a trail.** Pass the trail handle (`T-12`) as `handle` and the plan
run's id as `runId`: a plan run asks how the trail should ship this way,
and a `resume` answer re-fires the same plan run with the answers in its
prompt. The questions render in the trail page's Plan section.

**Use case:** Blocked on a product decision (which behaviour to keep,
which of two fixes to ship) — ask instead of guessing, then wait for the
answer.
