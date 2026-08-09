# Find-or-create a project by domain

Source: https://docs.shipeasy.ai/api/operations/upsertProject

> >-

Find-or-creates a project keyed by `(owner_email, domain)` under the session's owner, and returns it. Idempotent: a second call with the same domain returns the existing project with `created: false`.

Only `domain` is required — `name` defaults to the domain on first create. Recording the result in a local `.shipeasy` binding is a consumer side-effect; this endpoint never performs it.

**Use cases**

- **Install flow** — provision a per-app project without a trip to the dashboard. Run it on every install; the idempotent key means a re-run returns the existing project rather than duplicating it.
- **Name explicitly** — pass `name` to label the project distinctly from its `domain`.
