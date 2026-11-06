# Add a QA note to an item

Source: https://docs.shipeasy.ai/api/operations/createOpsQaNote

> >-

Append one typed QA note to a queue item. `kind` is `narrowing` (what now
passes vs what still fails), `clarification` (what "fixed" now means),
what was checked) or `correction` (withdraws an earlier framing). Notes
are append-only and appear in the item's QA notes section, not in the
comment thread. The author is the caller's identity; pass `agent` to
record the note as written by that agent type's QA automation.
status by itself: the dashboard offers an explicit "Reopen item" action,
and `ops update --status open` does the same from the CLI.

**Use case:** QA automation records "verified on production: FAIL, the
second facet still errors" as data an agent can read back.
