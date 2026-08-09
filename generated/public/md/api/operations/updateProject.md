# Update the current project

Source: https://docs.shipeasy.ai/api/operations/updateProject

> >-

Update the current project's settings — name, domain, slug, default environment, timezone, experiment-analysis knobs (statistical method, significance threshold, auto-rollback, minimum sample days), and the per-module enable flags. Partial: only the fields you send change.

The project id in the path must match the project the caller's credential resolves to (a credential can only edit its own project). Changing `domain` re-stamps the allowed origin into every live SDK key.

**Use case:** Rename a project, move its domain, toggle a module on/off, or tune the experiment-analysis defaults without leaving the CLI.
