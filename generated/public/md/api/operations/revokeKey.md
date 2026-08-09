# Revoke an API key

Source: https://docs.shipeasy.ai/api/operations/revokeKey

> >-

Revokes a key by id — stamps its `revoked_at` and deletes the hot-path KV entry so the token stops authenticating immediately. Takes no body.

Idempotent: revoking an already-revoked key is a no-op and returns the same `{ id, revoked: true }`. Returns `404` if no such key exists in the project.

**Use case:** Rotate a leaked or stale credential — mint the replacement, then revoke the old key.
