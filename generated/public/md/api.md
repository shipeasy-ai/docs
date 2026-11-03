# API reference

Source: https://docs.shipeasy.ai/api

> REST endpoints for feature flags, configs, killswitches, metrics, alerts and the ops queue — with live request samples in cURL, JavaScript, and Python.

The Admin API is the same surface the dashboard, CLI, and MCP server use. Every request:

- authenticates with `Authorization: Bearer sdk_admin_…`
- is scoped to the project the key belongs to, so no other header is needed
- speaks JSON, returns conventional HTTP status codes

```bash
curl https://shipeasy.ai/api/admin/gates \
  -H "Authorization: Bearer sdk_admin_..."
```

To act on a different project you administer, add `X-Project-Id: <projectId>` to the request. It
is an override, not a requirement.

Mint admin keys in the dashboard under **SDK keys**, with `shipeasy sdk keys create --type admin`,
or via `POST /api/admin/keys` with `type: "admin"`. Keys expire after 90 days; rotate with the
`revoke` action.

## Common patterns

**Pagination.** Paginated list endpoints return `{ data: [...], next_cursor: "..." }` (`next_cursor` is
`null` on the last page). Pass `?cursor=<next_cursor>` and `?limit=<n>` to page. Small, bounded
catalogs (for example flag templates) are returned in one page and take no `limit` or `cursor`.

**Errors.** All errors share a single envelope:

```json
{ "error": { "code": "not_found", "message": "Gate 'foo' not found" } }
```

**Idempotency.** `POST` writes that create resources accept `Idempotency-Key: <uuid>` and replay
the same response if you retry within 24h.

## Servers

| Surface | Base URL | Auth |
| --- | --- | --- |
| Admin API (everything in this reference unless noted) | `https://shipeasy.ai/api/admin` | admin key |
| Public ops intake (file a bug, file a feature request) | `https://api.shipeasy.ai` | client key with the `tickets:public_create` scope |

Public submissions are always filed as `pending_approval`, awaiting human approval. A status sent
by the caller cannot override that.

Environment names are `dev`, `staging` and `prod`.
