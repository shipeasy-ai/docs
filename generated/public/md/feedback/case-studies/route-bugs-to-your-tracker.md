# Route bug reports to your tracker

Source: https://docs.shipeasy.ai/feedback/case-studies/route-bugs-to-your-tracker

> Mirror confirmed bug reports into the issue tracker your engineers already use, and dedupe so one bug never opens five issues.

Your team already has an issue tracker. Bug reports filed through the [devtools overlay](https://docs.shipeasy.ai/feedback/devtools) live in Shipeasy, on **Home**. You don't want a second triage surface — you want each real bug to become an issue in the tracker your engineers work from, automatically, without spawning duplicates.

The shape: **a small job reads the queue → creates the issue → records the link on the item so it never runs twice.**

## 1. Read the confirmed bugs, not every report

Don't forward every raw report — most need a human glance first. Have your team move a report to `in_progress` once they have confirmed it, and let the job read only those:

```bash
shipeasy ops list --type bug --status in_progress
```

## 2. Map the report to an issue

The report already carries the context an engineer needs — URL, repro steps, actual and expected result, screenshot. Map it straight onto the issue body:

```ts
async function createTrackerIssue(bug: QueueItem) {
  return tracker.createIssue({
    title: bug.title,
    body: [
      bug.description,
      `**Steps:** ${bug.stepsToReproduce ?? "—"}`,
      `**Actual:** ${bug.actualResult ?? "—"}`,
      `**Expected:** ${bug.expectedResult ?? "—"}`,
      `Shipeasy: https://shipeasy.ai/dashboard/${projectId}?item=${bug.number}`,
    ].join("\n\n"),
  });
}
```

## 3. Dedupe with a tag

The job can run twice and a bug can be re-opened. To make issue creation idempotent, mark each item as synced the moment its issue exists, and skip anything already marked:

```ts
const items = await listBugs(); // GET /api/admin/ops?type=bug&status=in_progress
for (const bug of items) {
  if (bug.tags.includes("synced")) continue; // already mirrored — do nothing

  const issue = await createTrackerIssue(bug);

  // Leave the link on the item, then mark it
  await comment(bug.number, `Tracker issue: ${issue.url}`); // POST /api/admin/ops/{handle}/comments
  await addTag(bug.number, "synced"); //                        see `shipeasy tags update`
}
```

> **The tag is the dedup key**

Idempotency comes from <em>one</em> stored fact: the <code>synced</code> tag. Set it right after
the issue is created, check it every time. No separate dedup table, no fuzzy title matching.

## Rollout & measurement plan

- **One direction first.** Ship Shipeasy → tracker before you attempt status sync the other way. One-way forwarding is reliable; bidirectional sync is a project.
- **Filter by type.** Forward `bug` (and maybe auto-filed `error` tickets), not feature requests — those usually belong on a roadmap, not in the sprint.
- **Close the loop visibly.** The comment with the issue URL sits on the item, so triagers in Shipeasy can click straight through to the tracker.
- **Using GitHub?** The GitHub [connector](https://docs.shipeasy.ai/feedback/connectors) already opens an issue per new bug — no job needed.
- **Errors and alerts ride the same queue.** Auto-filed [error reports](https://docs.shipeasy.ai/feedback/error-reporting) and [alert tickets](https://docs.shipeasy.ai/feedback/case-studies/alert-to-ticket-loop) are queue items too — the same job forwards them if you don't filter them out.

**Related**

- [Devtools overlay](https://docs.shipeasy.ai/feedback/devtools) — Where bug reports come from
- [Error reporting](https://docs.shipeasy.ai/feedback/error-reporting) — Auto-filed error tickets in the same queue
- [Alert → ticket loop](https://docs.shipeasy.ai/feedback/case-studies/alert-to-ticket-loop) — Metric alerts that file their own tickets
