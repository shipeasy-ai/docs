# Ask QA a question about an item

Source: https://docs.shipeasy.ai/api/operations/askOpsQaQuestion

> >-

Put a question to QA on a queue item — use it when you do not know the
answer yourself and QA's decision unblocks the work. The question is open
until QA answers it; it surfaces on the item (`ops get` → `qaQuestions`)
and in the project-wide QA backlog (`ops list --qa-questions open`). The
asker is the caller's identity; pass `agent` to record it as asked by that
agent type.

**Use case:** A coding agent cannot tell whether an empty state is a bug or
intended; it asks QA and carries on with the rest of the item.
