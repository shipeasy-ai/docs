# List an item's questions

Source: https://docs.shipeasy.ai/api/operations/listOpsQuestions

> >-

The structured questions asked on a queue item, with their answers —
newest first (max 100). Pull this to read the answers to questions you
asked: an answered question reads `status: completed` and carries
`answer.selected` (the option labels picked) and `answer.other` (the
free-text "Other" reply, or `null`).

**Use case:** You asked with `delivery: poll` from a live session — poll
this until your questions read `completed`, then continue with the answers.
