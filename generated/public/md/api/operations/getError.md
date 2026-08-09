# Get a tracked error

Source: https://docs.shipeasy.ai/api/operations/getError

> >-

Returns a single tracked error by its id, including the latest occurrence's stack, extras, and consequence, plus `occurrences` — the sampled per-instance detail rows behind the issue (newest first; exhaustive while the issue is small, thinned at volume, capped at 100). Returns `404` if no such error exists in the project.

**Use case:** Drill into one issue — fetch its full stack and `seenUrls` to investigate, or walk `occurrences` to see how the failing message/stack varies across instances.
