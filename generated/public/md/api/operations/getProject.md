# Show a project by id

Source: https://docs.shipeasy.ai/api/operations/getProject

> >-

Returns one project by id — the same full shape as `GET /api/admin/projects/current`. The id in the path must match the project the caller's credential resolves to (a credential can only read its own project); any other id is a 403.

**Use case:** Re-fetch the project row after a `PATCH` when you already hold its id.
