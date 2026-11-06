# Replace an item's tags

Source: https://docs.shipeasy.ai/api/operations/setEntityTags

> >-

Replaces the item's whole tag set with `tags`: names not yet in the project are created, attached names not in the list are detached, and `[]` clears every tag. Names are deduped case-insensitively, reusing an existing tag's casing (sending `iOS` when `ios` exists attaches `ios`).

**Use cases**

- **Tag an item** — `{ "tags": ["checkout", "ios"] }`.
- **Clear tags** — `{ "tags": [] }`.

To add or remove a few tags without restating the rest, use the incremental `PATCH` instead.
