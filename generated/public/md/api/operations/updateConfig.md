# Update a dynamic config

Source: https://docs.shipeasy.ai/api/operations/updateConfig

> >-

Partial update. When `value` is supplied it is **republished on every env** (new version per env). A per-env key (`dev`/`staging`/`prod`) publishes a new version to **only that env**, immediately, overriding `value` for it. When `schema` is supplied it replaces the current schema; every existing value is re-validated.

**Use cases**

- **Republish flat value** — `{ "value": {…} }` sets the same value on every env.
- **Publish one env** — `{ "prod": {…} }` publishes a new version to prod only, instantly.
- **Schema migration** — `{ "schema": {…} }` replaces the schema; existing values are re-validated.
