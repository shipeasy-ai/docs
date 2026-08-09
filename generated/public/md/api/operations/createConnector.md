# Create a connector

Source: https://docs.shipeasy.ai/api/operations/createConnector

> Creates a connector. The request body is discriminated on provider.

Creates a connector. The request body is discriminated on `provider`.

- **OAuth/app providers** (`google_sheets`, `github`, `slack`) — supply `{ provider, name, events }`. The connector is created `enabled: false` with empty `config` and no credentials; the provider's OAuth flow then attaches credentials and enables it.
- **Trigger providers** (`claude_trigger`, `cursor_trigger`, `copilot_trigger`, `jules_trigger`) — supply `config` plus the provider's credential field(s) and the connector is fireable immediately. Trigger creates are **idempotent** by their natural key (`config.routineId` / `config.repoUrl` / `config.owner`+`config.repo` / `config.source`): re-creating updates the existing row rather than duplicating it.

**Use cases**

- **File bugs as GitHub Issues** — `{ "provider": "github", "name": "Bugs → acme/app", "events": ["bug.created"] }`, then finish the GitHub App install.
- **Nightly ops sweep** — register a `claude_trigger` with its `routineId` and (optionally) a fire `token`; subscribe `events` later to auto-fire on new bugs.
- **Cold cloud-agent run** — register a `cursor_trigger`/`jules_trigger` with the repo coordinates plus both keys, or a `copilot_trigger` with the repo + user PAT.
