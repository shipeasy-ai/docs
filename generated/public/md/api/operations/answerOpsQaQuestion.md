# Answer a QA question

Source: https://docs.shipeasy.ai/api/operations/answerOpsQaQuestion

> >-

Answer one open QA question. The question moves to `answered` and the
answer shows on the item. An answered question cannot be answered again
(409); ask a new one to follow up. The answerer is the caller's identity;
pass `agent` to record it as answered by that agent type's QA automation.

**Use case:** QA reads the backlog, checks the build, and replies "hide it —
archived metrics never show on readouts".
