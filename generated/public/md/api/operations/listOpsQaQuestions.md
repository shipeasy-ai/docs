# List an item's QA questions

Source: https://docs.shipeasy.ai/api/operations/listOpsQaQuestions

> >-

The questions put to QA on a queue item, newest first (max 100), each with
QA's answer once given. `ops get` returns the same list as `qaQuestions`.

**Use case:** After asking QA, poll this until the question reads `answered`.
