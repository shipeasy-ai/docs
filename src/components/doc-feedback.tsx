"use client";

/**
 * DocFeedback — the "Was this page helpful?" footer, rendered on every doc page
 * by `DocPageView` (one source of truth; not hand-placed in MDX).
 *
 * The docs site is statically exported, so there's no server to post to — the
 * vote is beaconed to the edge worker (`POST api.shipeasy.ai/docs/feedback`),
 * which records it to the DOCS_FEEDBACK Analytics Engine dataset. Fire-and-
 * forget: a failed beacon never blocks or surfaces to the reader.
 *
 * Flow: idle → click 👍/👎 → "Thanks!". A 👎 additionally reveals an optional
 * one-line comment box; sending it posts a second beacon carrying the text.
 */

import { useState } from "react";

const ENDPOINT = "https://api.shipeasy.ai/docs/feedback";

type Vote = "up" | "down";
type State = "idle" | Vote;

async function beacon(payload: { page: string; helpful: boolean; comment?: string }) {
  try {
    const body = JSON.stringify(payload);
    // sendBeacon survives the page unloading after a click; fall back to fetch
    // (keepalive) where it's unavailable or rejects the payload.
    if (
      typeof navigator !== "undefined" &&
      navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))
    ) {
      return;
    }
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Best-effort telemetry — swallow.
  }
}

export function DocFeedback({ page, editHref }: { page: string; editHref?: string }) {
  const [state, setState] = useState<State>("idle");
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);

  const vote = (v: Vote) => {
    if (state !== "idle") return;
    setState(v);
    void beacon({ page, helpful: v === "up" });
  };

  const sendComment = () => {
    const text = comment.trim();
    if (!text || commentSent) return;
    setCommentSent(true);
    void beacon({ page, helpful: false, comment: text });
  };

  const voted = state !== "idle";

  return (
    <div className="se-feedback not-prose" data-voted={voted ? "" : undefined}>
      <div className="se-feedback-row">
        <span className="q">
          {voted ? (
            <>
              <span className="se-feedback-tick" aria-hidden>
                ✓
              </span>
              Thanks for the feedback
            </>
          ) : (
            "Was this page helpful?"
          )}
        </span>

        {!voted ? (
          <div className="se-feedback-btns" role="group" aria-label="Was this page helpful?">
            <button
              type="button"
              onClick={() => vote("up")}
              aria-label="Yes, this page was helpful"
            >
              <span aria-hidden>👍</span> Yes
            </button>
            <button
              type="button"
              onClick={() => vote("down")}
              aria-label="No, this page needs work"
            >
              <span aria-hidden>👎</span> Not quite
            </button>
          </div>
        ) : (
          <span className={`se-feedback-chip ${state === "up" ? "up" : "down"}`} aria-hidden>
            {state === "up" ? "👍 Yes" : "👎 Not quite"}
          </span>
        )}

        {editHref ? (
          <a className="se-feedback-edit" href={editHref} target="_blank" rel="noopener">
            ✎ Edit this page
          </a>
        ) : null}
      </div>

      {state === "down" ? (
        <div className="se-feedback-followup">
          {commentSent ? (
            <span className="done">Got it — we&rsquo;ll use this to improve the page.</span>
          ) : (
            <>
              <input
                type="text"
                value={comment}
                maxLength={1024}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendComment();
                }}
                placeholder="What was missing or wrong? (optional)"
                aria-label="What was missing or wrong?"
              />
              <button type="button" onClick={sendComment} disabled={!comment.trim()}>
                Send
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
