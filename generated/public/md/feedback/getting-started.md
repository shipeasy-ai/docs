# Getting started

Source: https://docs.shipeasy.ai/feedback/getting-started

> Wire a "Report bug" button into your app in two minutes.

**Add the SDK**

```bash
npm i @shipeasy/sdk
```

Same SDK as flags and configs. No separate package, no separate API key.

**Configure once, use everywhere**

```bash
// app/layout.tsx
await shipeasy({ serverKey: process.env.SHIPEASY_SERVER_KEY ?? '' });
```

Same `shipeasy()` boot as the rest of the platform.

**File a bug from the browser**

```bash
// Mount the devtools nub once at app boot:
initDevtools();
// Then users press Shift+Alt+B to file a bug — overlay handles
// title, repro steps, screenshot capture, and posting.
```

The overlay posts via `/devtools-auth` with a short-lived
browser-scoped admin token. The bug shows up in the dashboard
within seconds.

**Capture a feature request**

```bash
// Same nub — users press Shift+Alt+R instead of Shift+Alt+B
// for a feature request. The form prompts for title, description,
// and use case (the fields the CLI `feedback features create`
// requires).
```

Other signed-in members of the project see the request in the Feature requests tab and can vote /
triage it.

**From the CLI**

```bash
shipeasy ops list --type bug
shipeasy ops list --type feature_request
```

Or use the dashboard. Either way the records live in your project.

## Where to next

- **[Case studies](https://docs.shipeasy.ai/feedback/case-studies)** — "Forward bugs to Slack", "Wire votes to a public roadmap", "Auto-attach session replay".

- **[API reference](https://docs.shipeasy.ai/feedback/api)** — `POST /api/admin/bugs`, `POST /api/admin/feature-requests`, listing, status updates.

- **[CLI commands](https://docs.shipeasy.ai/get-started/cli)** — Every `shipeasy feedback …` verb.

**Related**

- [The devtools overlay](https://docs.shipeasy.ai/feedback/devtools) — Filing without leaving the app
- [Connectors](https://docs.shipeasy.ai/feedback/connectors) — Mirror reports into GitHub, Sheets or Slack
- [Edge cases](https://docs.shipeasy.ai/feedback/edge-cases) — Spam, dedup, PII, anonymous users
- [Feedback API](https://docs.shipeasy.ai/feedback/api) — The REST endpoints underneath
