# Comment on an item

Source: https://docs.shipeasy.ai/api/operations/createOpsComment

> >-

Append a comment to a queue item's thread. The body is markdown (mentions
like `@teammate` notify that person; `@shipeasy` asks Jarvis, the AI agent,
to reply). Pass `parentId` to reply under an existing top-level comment
(one level of threading — a reply to a reply attaches to the same parent).

Create-only and append-only, so it is safe for restricted ops keys — the
same channel the ops loop and Jarvis use to leave a note on an item.
