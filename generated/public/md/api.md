# API reference

Source: https://docs.shipeasy.ai/api

> REST endpoints for feature flags, configs, killswitches, metrics, alerts and the ops queue — with live request samples in cURL, JavaScript, and Python.

The Admin API is the same surface the dashboard, CLI, and MCP server use. It speaks JSON and returns
conventional HTTP status codes. New here? Run the [quickstart](#quickstart-your-first-calls)
below, in order.

## Quickstart: your first calls

Four calls, in order, take you from no key to an evaluated flag.

**Mint an admin key**

The first key can't come from the API — minting one needs a key. Create it in the dashboard
under **SDK keys**, or run `shipeasy sdk keys create --type admin`. The token (`sdk_admin_…`) is
shown once, so copy it. Admin keys expire after 90 days; rotate with the
[`revoke`](https://docs.shipeasy.ai/api/operations/revokeKey) action.

```bash
export SHIPEASY_ADMIN_KEY=sdk_admin_...
```

**List your gates**

Confirms the key works and shows what the project already has. Returns
`{ data: [...], next_cursor }`; an empty `data` just means no gates yet.

```bash
curl https://shipeasy.ai/api/admin/gates \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY"
```

No gates yet? Create one — a name is the only required field
([Create a gate](https://docs.shipeasy.ai/api/operations/createGate)):

```bash
curl -X POST https://shipeasy.ai/api/admin/gates \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "name": "checkout_v2", "rollout_percent": 100 }'
```

**Mint a client key**

Evaluation runs on the edge, not on the Admin API, and takes an SDK key rather than an admin
key. Mint a client key with [`POST /api/admin/keys`](https://docs.shipeasy.ai/api/operations/createKey) and copy `key`
from the response:

```bash
curl -X POST https://shipeasy.ai/api/admin/keys \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "type": "client", "env": "prod", "name": "quickstart" }'
```

**Evaluate a flag**

Send a user to `POST https://api.shipeasy.ai/sdk/evaluate` with the client key. The response is
a flat map with every flag resolved for that user, so `flags.checkout_v2` is `true` or `false`:

```bash
curl -X POST https://api.shipeasy.ai/sdk/evaluate \
  -H "X-SDK-Key: sdk_client_..." \
  -H "Content-Type: application/json" \
  -d '{ "user": { "user_id": "u_123" } }'
```

In an app, the [SDKs](https://docs.shipeasy.ai/sdks) make this call for you (or evaluate locally with a server key) —
reach for the raw endpoint only to check a result.

## Authentication

Every Admin API request authenticates with `Authorization: Bearer sdk_admin_…` and is scoped to
the project the key belongs to, so no other header is needed. To act on a different project you
administer, add `X-Project-Id: <projectId>` to the request. It is an override, not a requirement.
Mint further keys in the dashboard under **SDK keys**, with `shipeasy sdk keys create`, or via
`POST /api/admin/keys`.

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
