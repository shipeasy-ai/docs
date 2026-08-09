# Errors dashboard & triage

Source: https://docs.shipeasy.ai/feedback/errors

> Fingerprint-grouped error issues with a status workflow, occurrence timeseries, and automatic re-open on regression.

The **Errors** page (`/dashboard/<projectId>/errors`, under **Ops → Errors**) is where the errors reported by [`see()`](https://docs.shipeasy.ai/feedback/error-reporting) land. Each distinct issue is grouped by **fingerprint** — so a thousand occurrences of the same problem are one row, not a thousand — and shown with its consequence sentence, occurrence trend, and triage state.

> **This is the read side of see()**

This page *displays* errors. Producing them is the SDK's job — wrap a catch with
`see(err).causes_the(…).to(…)`. See [Error reporting](https://docs.shipeasy.ai/feedback/error-reporting) for the producing
side.

## What a row shows

| Column                     | What it is                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Error**                  | The consequence sentence (e.g. _"TypeError causes the checkout to use cached prices"_) with the raw message underneath.                                               |
| **Trend · 14d**            | A daily occurrence sparkline, the total count, and the % change of the last 7 days vs the previous 7. Errors are lower-is-better, so an upward delta renders **red**. |
| **Impacted**               | Distinct users affected in the last 14 days.                                                                                                                          |
| **First seen / Last seen** | When the issue first and most recently fired.                                                                                                                         |

A project-wide **Error rate · 24h** banner sits above the table. The list polls every 30 seconds, so the page stays close to live without sockets.

## The status workflow

Every issue is in one of three states, shown as the tabs **Open**, **Resolved**, **Ignored** (plus **All**):

```
open  ──resolve──▶  resolved
open  ──ignore──▶   ignored
resolved/ignored ──reopen──▶  open
```

- **Open** — actively counts toward your open total.
- **Resolved** — you've fixed it. It moves out of the open list but stays grouped.
- **Ignored** — noise you've chosen to mute; hidden from open and no longer counted.

Flip status from the per-row **⋯** menu (**Mark resolved**, **Ignore**, **Reopen**), from the detail panel, or in bulk by selecting rows and using the bulk-action bar.

> **Regressions re-open the same issue**

Because issues are grouped by fingerprint, a recurrence of something you marked resolved
**re-opens the existing issue** instead of filing a brand-new one — so the history (first-seen,
full trend) stays intact and you're not chasing duplicates.

## Caused-by chains

When code does `see(err)` and re-throws, the outer report links to the inner one as a **caused-by** chain rather than double-counting. The detail panel surfaces the upstream issue, so you can trace a wrapped error back to its root cause without it inflating your counts.

## Filing an issue from an error

Each row has a **File an issue** action. It creates an `error`-type ticket in [Feedback](https://docs.shipeasy.ai/feedback/getting-started), pre-filled from the tracked error and linked back to it — once filed, the row shows a `#42` chip instead of the file button. From there a [connector](https://docs.shipeasy.ai/feedback/connectors) can mirror it to GitHub. Worker-side auto-filing uses the same link, so manually-filed and auto-filed tickets de-duplicate.

**Related**

- [Error reporting (see)](https://docs.shipeasy.ai/feedback/error-reporting) — The SDK side that produces these errors.
- [Connectors](https://docs.shipeasy.ai/feedback/connectors) — Mirror filed issues out to GitHub.
- [Feedback overview](https://docs.shipeasy.ai/feedback/getting-started) — Where filed error tickets live.
