# Answer a question

Source: https://docs.shipeasy.ai/api/operations/answerOpsQuestion

> >-

Answer one open question on a queue item — pick option labels in
`selected` (exactly one unless the question is `multiSelect`) and/or
write a free-text `other`. The question moves to `completed`. When it was
the last open question of a `resume` run, that agent is re-fired on the
item with every answer. A person's action: never allow-listed for
restricted ops keys.

**Use case:** Unblock an agent from the CLI instead of the dashboard.
