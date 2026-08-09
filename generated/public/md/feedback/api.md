# API reference

Source: https://docs.shipeasy.ai/feedback/api

> REST endpoints for bug reports and feature requests.

The feedback API lives under `/api/admin/bugs/*` and `/api/admin/feature-requests/*`. Auth is the
admin SDK key (Bearer token); the key itself carries the project scope, so no `X-Project-Id`
header is needed unless you're routing across projects.

```bash
curl https://shipeasy.ai/api/admin/bugs \
  -H "Authorization: Bearer sdk_admin_..."
```

## Resources

- **[Bugs](#bugs)** — `GET / POST / PATCH / DELETE /api/admin/bugs[/{id}]` — filter, file, update status / priority, delete.

- **[Feature requests](#feature-requests)** — `GET / POST / PATCH / DELETE /api/admin/feature-requests[/{id}]` — same shape, different status enum.

- **[In-page capture](#capture)** — The devtools overlay (`@shipeasy/devtools`) files bugs + feature requests directly through these admin endpoints using a short-lived browser-scoped admin token minted at `/devtools-auth`. There is no separate public-ingest endpoint today.

> **OpenAPI coverage**

Auto-generated OpenAPI pages for feedback are in progress. The CLI consumes these endpoints today;
the docs build will surface them once the schema is ported into the `@shipeasy/admin-api` resource
registry.

## Bug payload

```json
{
  "title": "Checkout button overlaps footer on iOS Safari",
  "pageUrl": "https://example.com/checkout",
  "stackTrace": "TypeError: ...", // optional
  "screenshotUrl": "https://...", // optional
  "userId": "u_abc" // optional, server-derived from session if omitted
}
```

## Feature request payload

```json
{
  "title": "Dark mode for the dashboard",
  "importance": "important",
  "userId": "u_abc"
}
```
