# Search project resources

Source: https://docs.shipeasy.ai/api/operations/searchResources

> >-

Universal substring search across the project's primary resources — feature gates, experiments, dynamic configs, killswitches, metrics, and team members. Matches the trimmed `q` against each resource's immutable `name` and its human title/display name (members match on display name or email), newest-first, capped per resource family so one noisy type can't crowd out the rest.

Returns a flat, ranked-by-type list of hits (members first); an empty or whitespace-only `q` returns no hits. Each hit carries a project-relative `href` that deep-links to the row.

**Use case:** Back a command-palette / quick-switcher in the dashboard, or look up the id of a resource by a fragment of its name before driving another API call.
