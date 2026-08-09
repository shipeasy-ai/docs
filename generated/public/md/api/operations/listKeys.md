# List API keys

Source: https://docs.shipeasy.ai/api/operations/listKeys

> >-

Returns a single page of the project's API keys ordered by `created_at desc, id desc`, in the standard `{ data, next_cursor }` envelope. Use the `cursor` query parameter to paginate.

Response fields are **snake_case** (`created_at`, `revoked_at`, `created_by_email`, `last4`). The raw token is never returned — only its `last4` tail, so a held key can be matched against the masked row. Revoked keys are included (with a non-null `revoked_at`).

**Use case:** Audit which keys exist for a project — surface stale or never-expiring keys, or drive a CI check that asserts no `client` key is still active in `prod` after a rotation.
