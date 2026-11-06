# Link a pull request to a trail

Source: https://docs.shipeasy.ai/api/operations/linkTrailPr

> >-

Link a pull request to the trail as one of its *changes*. From then on the GitHub webhook records its pushes, the project's review agents score each push, and the merge gates read it. Linking a pull request the trail already has is a no-op; a pull request that belongs to a different trail is refused with `409`. Pass `item` when an item's run opened the PR, so the change shows under that item.

Safe for the restricted ops key.

**Use case:** A coding agent working a trail opens a PR and links it with `trails link-pr T-12 <url>`.
