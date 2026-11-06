# List trails

Source: https://docs.shipeasy.ai/api/operations/listTrails

> >-

Returns the project's trails, newest activity first. A trail is the unit of shipping: an outcome that takes several items, pull requests and release tools, with a lead, start and target dates, a health and a progress (items done over items on the trail). The phase, health and counts on each row are a snapshot; read one trail with `trails get` for the live state.

**Dashboard table read.** `view=table` is the contract every dashboard list table shares: the endpoint applies `f`, `sort` and `cursor` in SQL and answers `{ data, next_cursor, section_counts?, grouped? }`. Filters and sorts are never applied in the browser, so a condition the server cannot evaluate is a `400`.
- `f` — a JSON array of `{ "f": field, "o": operator, "v": value }` conditions, all ANDed. Fields are the snapshot columns: `phase`, `status`, `type`, `priority`, `owner`, `health`, `targetDate`, `changesOpen`, `changesMergeable`, `findingsOpenHigh`, `itemsOpen`, `itemsTotal`, `itemsDone`, `releasedPct`, `updatedAt`.
- `sort` — a column id, `-` prefixed for descending: `number`, `title`, `phase`, `priority`, `owner`, `health`, `progress` (items done over items on the trail), `target` (the target date), `changes`, `findings`, `items`, `released`, `updated`, `created`. Defaults to `-updated`.
- `cursor` — the previous page's `next_cursor`; `limit` is the page size (1–200, default 50).

**Scopes** (`scope`) are the dashboard's tabs: `mine` (trails you own), `reviewing`, `ready`, `releasing`, `shipped`, `closed`, or `all` (the default).

**Attribution.** `mergedSince` and `touches` list the trails that merged inside a window and changed a path or linked a resource — the candidates for an error or alert that started after a release.

**Use case:** Find the trail already shipping a feature before creating another, or list what merged in the last 72 hours to attribute a new alert.
