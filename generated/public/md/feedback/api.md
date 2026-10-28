# API reference

Source: https://docs.shipeasy.ai/feedback/api

> REST endpoints for filing, reading and updating bug reports and feature requests, including the public intake.

Bugs and feature requests are items in one ops queue, so there is one set of endpoints for both:
`/api/admin/ops`. Pick the kind with `type: bug | feature_request` when you file one. Every
operation is in the generated [API reference](https://docs.shipeasy.ai/api); this page is the map.

Admin calls authenticate with an admin key (`Authorization: Bearer sdk_admin_…`). The key carries
its project, so no `X-Project-Id` header is needed — send it only to act on a different project you
administer. See [API reference](https://docs.shipeasy.ai/api) for the one auth model.

```bash
curl https://shipeasy.ai/api/admin/ops?type=bug \
  -H "Authorization: Bearer sdk_admin_..."
```

## Resources

- **[List the queue](https://docs.shipeasy.ai/api/operations/listOpsItems)** — `GET /api/admin/ops` filters by `type` (`bug`, `feature_request`, `error`, `alert`) and `status`, in work order.

- **[File an item](https://docs.shipeasy.ai/api/operations/createOpsItem)** — `POST /api/admin/ops` files a bug or a feature request. Title is required; everything else is optional.

- **[Update an item](https://docs.shipeasy.ai/api/operations/updateOpsItem)** — `PATCH /api/admin/ops/{handle}` changes status, priority, owner and tags. The handle is the item number (`7`) or its full id.

- **[Public intake](#public-intake)** — A client key can file a bug or feature request without an admin key. Off by default.

- **[In-page capture](#capture)** — The devtools overlay (`@shipeasy/devtools`) files bugs and feature requests through these admin endpoints with a short-lived browser-scoped token minted at `/devtools-auth`.

## Statuses

One vocabulary for every item in the queue, shown the same way in the dashboard, the CLI and Slack:

| Status         | Meaning                              |
| -------------- | ------------------------------------ |
| `open`         | Filed, nobody has started            |
| `in_progress`  | Being worked                         |
| `blocked`      | Work has stopped                     |
| `ready_for_qa` | A fix has landed and awaits sign-off |
| `resolved`     | Signed off                           |
| `wont_fix`     | Closed without a change              |

Two more are set by the system and cannot be chosen by hand: `investigating_by_ai` while an agent has
the item, and `pending_approval` for anything that arrived through the public intake.

## Public intake [#public-intake]

The public intake is the one way to file into a project without an admin key. It authenticates with
a **client** key and is served by the edge worker at `api.shipeasy.ai`, not the admin API:

- `POST /ops/bug` — [File a bug](https://docs.shipeasy.ai/api/operations/createPublicBug)
- `POST /ops/feature-request` — [File a feature request](https://docs.shipeasy.ai/api/operations/createPublicFeatureRequest)

It is **off by default**. Three gates must all hold before a ticket is filed, and nothing in the
request can widen them:

1. The project has **Settings → Ops → Public intake → Public bug intake** switched on.
2. The key is a client key carrying the `tickets:public_create` scope —
   `shipeasy sdk keys create --type client --scopes tickets:public_create`.
3. The ticket lands as `pending_approval`, parked out of the work queue until someone on the team
   approves it from Home.

Repeat submissions of the same title dedupe against the open ticket instead of filing again.

```bash
curl https://api.shipeasy.ai/ops/bug \
  -H "X-SDK-Key: sdk_client_..." \
  -H "Content-Type: application/json" \
  -d '{ "title": "Checkout button overlaps the footer on iOS Safari" }'
```

## In-page capture [#capture]

The devtools overlay (`@shipeasy/devtools`) files bugs and feature requests with a short-lived
browser-scoped token minted at `/devtools-auth`. That path is separate from the public intake and
needs no switch in Settings.

## Bug payload

```json
{
  "type": "bug",
  "title": "Checkout button overlaps footer on iOS Safari",
  "stepsToReproduce": "Open /checkout on iOS Safari, scroll to the bottom",
  "actualResult": "The button covers the footer links",
  "expectedResult": "The button sits above the footer"
}
```

## Feature request payload

```json
{
  "type": "feature_request",
  "title": "Dark mode for the dashboard",
  "description": "Let me pick a dark theme",
  "useCase": "I work late"
}
```
