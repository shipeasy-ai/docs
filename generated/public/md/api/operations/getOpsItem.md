# Get one queue item

Source: https://docs.shipeasy.ai/api/operations/getOpsItem

> Fetch a single queue item by its per-project number or full id.

Fetch a single queue item by its per-project `number` or full id.

An item linked to others (blocked by / blocking / duplicate of) carries its `group`: every connected item, and the `master` agent runs work through. Pass `include=linked` to inline the other members' content as `linkedItems`, so one call reads the whole group.

**Use cases**

- **Inspect one item** before updating its status or linking a PR.
- **Pick up linked work** — `include=linked` reads the master and everything tied to it before a run starts.
