# Create a recurring coding-agent trigger

Source: https://docs.shipeasy.ai/api/operations/createTriggerConnector

> >-

Creates (or idempotently updates) a coding-agent **trigger** connector — the recurring, unattended run that burns down the ops queue in `--pr` mode. Discriminated on `provider`; only the four Shipeasy-fireable providers are accepted (`claude_trigger`, `cursor_trigger`, `copilot_trigger`, `jules_trigger`). Config + credential(s) arrive together; creates are idempotent by the provider's natural key, so re-creating updates the existing row.

Platforms without a fire endpoint (Codex, Windsurf, Cline, OpenClaw, OpenCode, Continue) cannot be created here — they are scheduled on their own platform (typically a GitHub Actions `schedule:` cron running the platform's headless CLI with the trigger prompt).

**Use cases**

- **Register a Claude routine** — after `RemoteTrigger {action:"create"}` returns `trig_…`, `{ "provider": "claude_trigger", "config": { "routineId": "trig_…" } }` (tokenless is fine; add the fire token later).
- **Cold Cursor/Jules run** — repo coordinates + both keys; Shipeasy launches the run and the PR opens via the provider's GitHub App.
- **Copilot cloud agent** — repo + a Copilot-licensed user PAT with the "Agent tasks" permission.
