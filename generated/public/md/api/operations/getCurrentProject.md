# Show the current project

Source: https://docs.shipeasy.ai/api/operations/getCurrentProject

> >-

Returns the project the caller's auth header resolves to — plan, status, billing, and which modules are enabled. The server reads the project from the credential, so there is no id parameter. Powers `whoami`.

**Use case:** Resolve who you are — the project, plan, and enabled modules tied to the current credential — without passing an id. Backs a registry-driven `whoami`.
