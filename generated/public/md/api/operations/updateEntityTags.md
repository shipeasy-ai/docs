# Add or remove tags on an item

Source: https://docs.shipeasy.ai/api/operations/updateEntityTags

> >-

Edits an item's tags incrementally: attaches every name in `add` (creating project tags as needed) and detaches every name in `remove`, leaving the item's other tags untouched. Matching is case-insensitive; a name in both lists ends up removed.

**Use cases**

- **Add a tag** — `{ "add": ["regression"] }`.
- **Swap a tag** — `{ "add": ["p1"], "remove": ["p2"] }`.
