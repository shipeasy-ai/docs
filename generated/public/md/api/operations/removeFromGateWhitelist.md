# Remove entries from a gate's whitelist

Source: https://docs.shipeasy.ai/api/operations/removeFromGateWhitelist

> >-

Removes identities from the gate's whitelist. Entries that aren't on the list are skipped, so the call is idempotent.

Removing the last entry leaves an empty whitelist block in place; to drop the block itself use `PUT` with `entries: []`.

**Use case:** Revoke one beta tester's access without touching anyone else's.
