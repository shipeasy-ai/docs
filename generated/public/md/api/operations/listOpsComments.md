# List an item's comments

Source: https://docs.shipeasy.ai/api/operations/listOpsComments

> >-

List the comment thread on a queue item, oldest first. Each comment
carries its author (a teammate email, or `system` for a comment authored by
Jarvis — the AI agent), its markdown body, and `parentId` for the single
level of threaded replies. Removed comments are omitted.

**Use case:** Read the discussion on an item before replying or acting on it.
