# Replace a gate's whitelist

Source: https://docs.shipeasy.ai/api/operations/setGateWhitelist

> >-

Replaces the gate's whole whitelist with `entries`, creating the block if the gate didn't have one. Idempotent — the same call twice leaves the same list.

This is the only whitelist call that can switch `attr` (`email` ⇄ `user_id`) or clear the block: `entries: []` removes the whitelist from the gate entirely.

**Use cases**

- **Pin an exact list** — `{ "entries": ["alice@acme.dev", "bob@acme.dev"] }`.
- **Switch to user ids** — `{ "attr": "user_id", "entries": ["usr_123"] }`.
- **Drop the whitelist** — `{ "entries": [] }`.
