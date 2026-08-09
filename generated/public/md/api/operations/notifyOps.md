# Raise an attention notification

Source: https://docs.shipeasy.ai/api/operations/notifyOps

> >-

Raise a 'needs your attention' bell notification. Create-only and idempotent on `dedupeKey` — re-raising with the same key updates the one card instead of stacking duplicates. It never reads, marks read, or deletes the feed, so it is safe for restricted ops keys.

**Use case:** Escalate work that can't land in code (a product decision, a credential only a human has, a resource only a human may edit), deduped so repeats don't spam the bell.
