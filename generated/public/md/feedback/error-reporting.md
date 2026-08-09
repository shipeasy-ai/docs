# Error reporting with see()

Source: https://docs.shipeasy.ai/feedback/error-reporting

> Report every handled exception with see() so it folds into the errors primitive with a product consequence.

`see()` is the error-reporting primitive in `@shipeasy/sdk`. You hand it a caught
exception and a one-sentence **consequence** — what feature broke and how it
degraded — and the SDK ships a structured issue to your project. Issues group by
fingerprint, surface in the dashboard **Errors** tab, and auto-file a ticket once
they cross a threshold.

There is no separate error SDK and no second API key. `see()` rides the same
`shipeasy()` boot as flags, configs, and kill switches — the server uses the
server key, the browser uses the client key.

## The shape

```ts
import { see } from "@shipeasy/sdk/client"; // or "@shipeasy/sdk/server"

try {
  await chargeCard(order, await fetchPrices(order.id));
} catch (e) {
  see(e).causes_the("checkout").to("fall back to cached prices").extras({ order_id: order.id });
  await chargeCard(order, cachedPrices); // degrade, don't crash
}
```

That call produces an issue titled **"…​ causes the checkout to fall back to
cached prices"**. The grammar is identical on both sides — the only difference is
the import. There is no `.send()`: the report dispatches on the next microtask,
fire-and-forget, and `see()` never throws (it no-ops before `shipeasy()` has run).

> **Note**

`.causes_the()` and `.causesThe()` are the same method — use whichever reads better in your
codebase. `.extras()` is optional, can be called more than once (keys merge), and accepts string /
number / boolean values.

## The consequence is the point

Every `see()` call names a **consequence**: a `subject` (the feature or surface
that was affected) and an `outcome` (the class of degraded behavior). It reads as
one sentence and becomes the issue title:

> `{error}` causes the **`{subject}`** to **`{outcome}`**.

The consequence is what turns a stack trace into something you can triage. It is
also part of the fingerprint, so two different failures of the same feature group
together, and the same exception harming two surfaces splits into two issues.

- **subject — a bare noun phrase** — The feature, not the mechanism. `"checkout"`, `"flag snapshot"`, `"search results"`. No articles (`"the checkout"`), no transport (`"network request"`).

- **outcome — a class of behavior** — What the user gets instead. `"fall back to cached prices"`, `"render an empty list"`. Never interpolate variable data (a status code, an id) — see below.

> **Note**

**Never put variable data in the subject or outcome.** A consequence like `to("fail with HTTP " +
status)` mints a fresh issue per status code and shatters your error feed. Keep the consequence
low-cardinality (`to("fail with a server error")`) and push the specifics into `.extras({status}
)`. Renaming a consequence re-fingerprints the issue — the old row stops growing and a new one
starts.

## When you don't need to call see()

The browser SDK auto-captures **failed network calls** by default — those name a
specific endpoint, so the SDK can write a useful consequence on its own.
Everything else is yours: add an explicit `see()` wherever you **catch** an error
and know the product consequence.

- **Auto-captured for you** — Failed `fetch` calls (offline / DNS / CORS) and HTTP 5xx responses — each reported against the specific endpoint that failed, no code from you.

- **You write the see()** — Everything else — a `try/catch` where you recover or degrade, and any uncaught error or rejection. Only your code knows which feature was affected and how; a generic global handler can't name that, so the SDK deliberately doesn't guess. Report it where you catch it.

## Problems that aren't exceptions

When something is wrong but nothing was thrown, report a **Violation**. The
`name` is a stable identifier (it's fingerprinted, so keep variable data out of
it); a Violation has no `.message()` — all context goes in `.extras()`.

```ts
if (rows.length > LIMIT) {
  see
    .Violation("oversized query")
    .causes_the("search results")
    .to("be trimmed")
    .extras({ actual: rows.length, cap: LIMIT });
  rows = rows.slice(0, LIMIT);
}
```

Prefer passing the real `Error` to `see()` whenever you have one — it preserves
the stack and error type. Reach for `Violation` only when there is no exception.

## Expected throws: mark, don't report

Some `throw`s are control flow, not failures — a parser that tries one decoder
then another, an existence check that throws on "not found." Mark them so
auto-capture stays quiet:

```ts
import { see } from "@shipeasy/sdk/server";

try {
  return decodeFoo(blob);
} catch (e) {
  see.ControlFlowException(e).because("because the blob wasn't a Foo");
  return decodeBar(blob);
}
```

Pass the reason to `.because()` — it must start with `"because"`. Nothing is
reported; you've told the SDK this throw is expected. An optional `.extras({…})`
tail attaches local debug context (kept on the mark, never sent).

## What lands where

- `see(error)` (Error) — The caught exception. Stack and error type are preserved and fingerprinted.
- `.causes_the(subject)` (string) — The affected feature, as a bare noun phrase. Part of the fingerprint.
- `.to(outcome)` (string) — The degraded behavior, as a low-cardinality class. Part of the fingerprint.
- `.extras({…})` (Record<string, string | number | boolean>) — Debugging context. Merges across calls. Strings clamp to 200 chars, max 20 keys.
- `see.Violation(name)` (string) — Report a non-exception problem. name is the stable fingerprint key.
- `see.ControlFlowException(e).because(reason)` ((unknown) → chain) — Mark an expected throw so auto-capture skips it. reason must start with 'because'. Optional .extras({…}) tail for local debug context (never sent).

## From see() to a ticket

1. **Dispatch.** `see()` posts a structured event to `/collect` — `sendBeacon`
   in the browser, fire-and-forget `fetch` on the server. A 30-second dedup
   window and a per-session cap keep a loop from flooding the feed.
2. **Fingerprint & group.** The Worker normalizes the message and stack, folds in
   the consequence, and upserts one row per fingerprint in the `errors` table
   (with a timeseries in Analytics Engine). Recurrences bump the count; a resolved
   issue reopens automatically when it happens again.
3. **Auto-file a ticket.** When an issue's count crosses the threshold (**10**
   occurrences), Shipeasy files a feedback ticket of type **error**, with
   priority scaled by the error kind (network failures rank above caught ones).
   It dedupes by fingerprint, so one issue files at most one open ticket.
4. **Triage.** The ticket joins your bugs and feature requests in the unified
   queue, where `/shipeasy:ops:work` can burn it down like any other item.

> **Note**

**Cross-runtime correlation.** The browser SDK stamps each same-origin request with an
`X-SE-Correlation` header; the server reads it back from the request context. When a client-side
5xx and the server exception that caused it both report, Shipeasy joins them — so a broken page
links straight to its root cause on the server.

## Rules that keep the feed clean

- **No generic global wrapper** — A catch-all that funnels every error through one `see()` can't name the feature, so every issue gets the same useless consequence. Report at the `try/catch` that knows what broke.

- **see() then re-throw is fine** — Report the specific consequence you know, then re-throw to let an outer boundary handle it. The re-thrown error links back to your report as a `caused_by` chain — it isn't double-counted.

## Where to next

- **[Configure alerts](https://docs.shipeasy.ai/metrics/alerts)** — Turn event metrics into threshold alerts that file their own tickets.

- **[Wire up the SDK](https://docs.shipeasy.ai/feedback/getting-started)** — The one `shipeasy()` boot that powers errors, bugs, and requests.

- **[API reference](https://docs.shipeasy.ai/feedback/api)** — The `errors` and `feedback` admin endpoints.

**Related**

- [Errors dashboard](https://docs.shipeasy.ai/feedback/errors) — Where a reported error lands
- [Evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) — The other thing worth reporting
- [Alert to auto-filed ticket](https://docs.shipeasy.ai/feedback/case-studies/alert-to-ticket-loop) — Errors that open their own ticket
- [Feedback API](https://docs.shipeasy.ai/feedback/api) — Report from a language with no SDK
