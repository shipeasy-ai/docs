# Case studies

Source: https://docs.shipeasy.ai/feedback/case-studies

> Bug & feature request workflows — from "report bug" button to tracker sync.

- **[Add a 'Report bug' button](#report-bug-button)** — Two-minute integration. Captures URL, optional screenshot, ships to Home.

- **[Public voting roadmap](#voting-roadmap)** — Surface feature requests on a marketing page so users can up-vote without signing in.

- **[Forward triaged bugs to GitHub](#github-sync)** — GitHub connector opens an issue for every new bug, with the bug payload.

- **[Auto-attach session replay](#session-replay)** — Glue your session-replay link onto each bug at capture time.

## Add a 'Report bug' button [#report-bug-button]

The smallest possible integration: a draggable nub on every page that
captures "something is wrong here" in two clicks. No modal, no form
schema, no triage UI to build — `@shipeasy/devtools` mounts the
overlay, lets the user file a bug or feature request with optional
screenshot + console-log + repro-steps capture, and posts it through
the admin endpoints with a short-lived browser-scoped admin token
minted at `/devtools-auth`.

What this gets you:

- Page URL, browser family, viewport — auto-captured.
- The user's free-text answer to "what's broken?" and the reproduction steps prompt.
- Screenshot of the page at the moment they filed it (configurable).
- Console logs + the last few breadcrumbs leading up to the report.
- The signed-in identity if you've bound a `Client` to the signed-in user.

```tsx
// app/layout.tsx — drop the devtools overlay once, anywhere on the page
"use client";
import { useEffect } from "react";
import { init as initDevtools } from "@shipeasy/devtools";

export function DevtoolsNub() {
  useEffect(() => initDevtools(), []);
  return null;
}
```

Users press **Shift+Alt+B** for a bug or **Shift+Alt+R** for a feature
request. The nub also has a draggable click target for users who don't
know the hotkey. The first time a user files a report from a given
origin, a popup prompts them to approve the devtools session (the
project-scoped admin token is bound to the popup's signed-in user) — a
one-time click; subsequent reports go through silently for the session
lifetime.

## Stack-rank feature requests by demand [#stack-rank-requests]

You're tired of hearing the same five feature requests in support and
want to stack-rank them by actual demand instead of by who's loudest.
Feature requests filed via the devtools nub (same `Shift+Alt+R` hotkey
as the bug report flow above) land on **Home**, filed as feature requests,
with the requester's identity, page URL, free-text use case, and any
attached screenshots.

Filter Home to feature requests to see them together. A public,
vote-on-able roadmap surface — where signed-out visitors can up-vote
requests on a shareable page — is not available today. For now use the
queue as the internal source of truth and pull the top items into your
normal quarterly planning.

## Forward triaged bugs to GitHub [#github-sync]

You triage in Shipeasy (because that's where the dedup'd reports already
live) but you ship in your tracker (GitHub Issues, for most teams).
Don't make humans copy-paste; the **GitHub connector** does the
transition for you.

[Create a `github` connector](https://docs.shipeasy.ai/feedback/connectors#setting-up-a-github-or-google-sheets-connector)
with the API, point it at the target repo, and pick `bug.created` as the
event. The connector opens a GitHub issue with the bug title,
reproduction steps, page URL, and reporter — and writes the issue URL
back onto the bug so triagers can jump to GitHub straight from Home.

For any other tracker, run the small sync job in
[Route bug reports to your tracker](https://docs.shipeasy.ai/feedback/case-studies/route-bugs-to-your-tracker),
or hand new bugs to a coding-agent trigger that files the issue for you.

The pattern that closes the loop in either case:

- **The connector writes the external URL back** onto the bug's `external_link` field. Triagers jump from Home to GitHub with a single click.
- **Dedup before forwarding.** Shipeasy collapses bug reports by page + repro fingerprint before the connector sees them, so a flurry of users hitting the same bug doesn't create N GitHub issues.

## Auto-attach session replay [#session-replay]

A title and a URL is rarely enough to reproduce a bug. The user clicked something, then something
broke, and the _something_ is what you actually need to see. If you already run a session-replay
tool, the integration is two lines.

The devtools overlay's bug-report form has a free-text **Notes** field
and an optional **Screenshots** capture. Until first-class replay
attachments ship, the practical pattern is to paste the replay URL
into the Notes field. The dashboard renders Notes as Markdown, so a
plain replay link is clickable from the bug.

For a one-click flow, drop a `Report bug` shortcut on your page header
that pre-fills the URL alongside the devtools nub trigger:

```tsx
"use client";
import { useEffect } from "react";
import { init as initDevtools } from "@shipeasy/devtools";
import { getReplayId } from "./replay"; // your replay tool's session id

export function ReportBugWithReplay() {
  useEffect(() => initDevtools(), []);
  return (
    <button
      onClick={() => {
        const replayId = getReplayId();
        if (replayId) {
          // Stash on `window` so the user can paste it into the
          // devtools Notes field when the bug form opens.
          (window as unknown as { __se_replay?: string }).__se_replay =
            `Replay: https://replays.example.com/${replayId}`;
        }
        // Fire the same hotkey the nub binds.
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "B",
            shiftKey: true,
            altKey: true,
          }),
        );
      }}
    >
      Report bug (with replay)
    </button>
  );
}
```

A few decisions:

- **Don't store the replay payload in Shipeasy.** Store the URL. Replays are large, they have their own retention story, and you don't want two systems holding the same blob.
- **Sample-aware.** Most replay tools sample (e.g. 10% of sessions). If a user hits the bug button and `getReplayId()` is `null`, the bug still files — just without a replay link. Drop the link, not the report.
