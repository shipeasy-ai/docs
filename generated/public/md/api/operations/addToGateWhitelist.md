# Add entries to a gate's whitelist

Source: https://docs.shipeasy.ai/api/operations/addToGateWhitelist

> >-

Adds identities to the gate's whitelist, creating the block if the gate doesn't have one yet. Entries already on the list are skipped, so the call is idempotent and safe to retry.

Adding to a gate that already has a whitelist keyed on the other attribute is rejected (409) rather than silently re-keying the entries already there — use `PUT` to switch `attr` deliberately.

**Use case:** Let one more customer into a private beta without reading the current list first.
