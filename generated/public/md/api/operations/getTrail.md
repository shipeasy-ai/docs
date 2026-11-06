# Show a trail

Source: https://docs.shipeasy.ai/api/operations/getTrail

> >-

A trail followed from intent to release: its phase, every change (each a pull request) with its latest push, merge gates, CI checks, each review agent's eval next to its last five, every finding (open first, worst first, `stale` when raised on an earlier push), approvals and pushes; the items discovered on it; the product resources it ships with their live state; the runs working it; and the suspected regressions awaiting a person.

Gates are read live from GitHub on every call, so a `state` of `unknown` means GitHub could not be read and the PR-backed gates read `pending`. Phase and counts are recomputed live. Pass `files` to include each merged change's full changed-file list and the diff link.

Safe for the restricted ops key.

**Use case:** After pushing a fix, a coding agent reads the trail to see which findings are still open and whether the scores have turned green.
