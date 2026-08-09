# CLI

Source: https://docs.shipeasy.ai/get-started/cli

> The `shipeasy` command — manage flags, configs, kill switches, metrics, the ops queue, keys, and the MCP server from your terminal or CI.

The CLI is a thin wrapper over the same Server Actions the dashboard uses. Anything you can do in the UI works from a terminal, and every read command supports `--json` so you can pipe results into scripts.

## Install

```bash
npm install -g @shipeasy/cli
```

```bash
shipeasy --version
shipeasy --help
```

See [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) for the login flow.

## At a glance

shipeasy whoami

\nProject: acme\nEmail: you@example.com\nWorker URL: https://api.shipeasy.ai\n
App URL: https://shipeasy.ai

```bash
shipeasy release flags list
shipeasy release configs list
shipeasy release killswitch list
shipeasy sdk keys list
shipeasy mcp install
```

Add `--json` to any read command for machine-readable output. Add `--project <id>` to override the active project for a single call.

## Global flags

The CLI doesn't have process-wide global options today — each
subcommand declares its own flags. Two flags are accepted by nearly
every write command, though:

- `--project <id>` (string) — Override the active project for this call. Wins over `SHIPEASY_PROJECT_ID` and the `.shipeasy` file in the cwd.
- `--json` (boolean) — On read commands, emit machine-readable JSON to stdout. On write commands, emit the created/updated resource as JSON instead of the human-readable confirmation line.

Env scoping is per-subcommand (e.g. `configs draft --env staging`)
rather than a global `--env` flag.

## Auth

| Command                          | Description                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `shipeasy login`     | PKCE browser flow. Saves credentials to `~/.shipeasy/credentials`.  |
| `shipeasy logout`    | Wipe credentials.                                                   |
| `shipeasy whoami`    | Show the active project, email, and accessible projects.            |
| `shipeasy bind <id>` | Bind the cwd to a project (writes `.shipeasy` in the project root). |

## Feature flags

| Command                                            | Description                                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `shipeasy release flags list`          | List every feature flag in the project                                                        |
| `shipeasy release flags create <name>` | Create a flag. Options: `--rollout-percent <pct>` (default 0), `--rules <json>`, `--salt <s>` |
| `shipeasy release flags update <id>`   | Change a flag. `--rollout-percent 0` is an instant off switch; `--salt` is fixed at create    |
| `shipeasy release flags enable <id>`   | Set the flag's `enabled` bit to true                                                          |
| `shipeasy release flags disable <id>`  | Set `enabled` to false (keeps rules)                                                          |
| `shipeasy release flags archive <id>`  | Archive the flag. `shipeasy release flags activity <id>` shows its audit log      |

`--rules` accepts a JSON array of `{ attr, op, value }` rules — the same shape the dashboard produces:

```bash
shipeasy release flags create new-ui \
  --rollout-percent 25 \
  --rules '[{"attr":"plan","op":"eq","value":"pro"}]'
```

## Killswitches (alias `ks`) — break-glass

| Command                                                                 | Description                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `shipeasy release killswitch list`                          | List all kill switches. `ks` is the short alias                        |
| `shipeasy release ks create <name>`                         | Create a kill switch (`folder.name`)                                   |
| `shipeasy release ks update <id>`                           | Update the default `--value`, the `--switches` map, or the description |
| `shipeasy release ks set <id> --switch-key <k> --value <v>` | Set one named switch on one `--env` (default `prod`)                   |
| `shipeasy release ks unset <id> --switch-key <k>`           | Remove a named switch from one `--env`                                 |
| `shipeasy release ks set-value <id> --value <v>`            | Set the kill switch's own on/off value                                 |
| `shipeasy release ks archive <id>`                          | Archive the kill switch                                                |

```bash
shipeasy release ks create email.outbound
shipeasy release ks set email.outbound --switch-key off --value true
```

## Dynamic values (configs)

| Command                                                   | Description                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `shipeasy release configs list`               | List every dynamic config                                                                |
| `shipeasy release configs get <id>`           | Read the current value                                                                   |
| `shipeasy release configs create <name>`      | Create a config. `--value <json>` seeds it; `--dev`/`--staging`/`--prod` publish per env |
| `shipeasy release configs update <id>`        | Update the value. Same per-env keys as `create`                                          |
| `shipeasy release configs update-schema <id>` | Replace the config's `--schema`                                                          |
| `shipeasy release configs archive <id>`       | Archive the config                                                                       |

Drafting and publishing a config per environment is dashboard-only — the CLI
writes each environment directly with `--dev` / `--staging` / `--prod`.

```bash
shipeasy release configs update pricing --value '{"base":9.99,"currency":"USD"}'
```

## Metrics

| Command                                      | Description                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `shipeasy metrics list`          | Every metric registered for the project.                                                              |
| `shipeasy metrics show <id>`     | Show one metric by id, including its query DSL.                                                       |
| `shipeasy metrics create <name>` | Define a new metric. Required: `--event-name <name>` + one of `--query <dsl>` or `--query-ir <json>`. |
| `shipeasy metrics grammar`       | Print the metric DSL grammar — handy when authoring `--query`.                                        |
| `shipeasy metrics archive <id>`  | Soft-delete a metric.                                                                                 |

## SDK keys

| Command                                           | Description                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| `shipeasy sdk keys list`              | List keys (id, kind, last used). The raw token is **never** shown after creation. |
| `shipeasy sdk keys create --type <server | client                                                                            | admin>` | Create a key (required: `--type`). Token is shown **once**. |
| `shipeasy sdk keys revoke <id>`       | Revoke by id or id-prefix. First match wins.                                      |

## API tokens

For long-lived CI access, create an **admin** SDK key from the dashboard's
**SDK Keys** page (`shipeasy sdk keys create --type admin`) and pass it
via the `SHIPEASY_CLI_TOKEN` env. See
[Authenticate → SDK keys vs API tokens](https://docs.shipeasy.ai/get-started/authenticate#sdk-keys-vs-api-tokens--pick-the-right-one)
for when to use each.

## Feedback (bugs & requests)

| Command                                                | Description                                         |
| ------------------------------------------------------ | --------------------------------------------------- |
| `shipeasy ops list --type bug`             | List bug reports. Drop `--type` for the whole queue |
| `shipeasy ops list --type feature_request` | List feature requests                               |
| `shipeasy ops bug <title>`                 | File a bug                                          |
| `shipeasy ops feature <title>`             | File a feature request                              |
| `shipeasy ops get\|update\|link-pr <handle>`           | Read, edit, or attach a PR to one item              |

`ops bug` takes the bug-report contract (`--steps-to-reproduce`,
`--actual-result`, `--expected-result`); `ops feature` takes `--description`, `--use-case`,
`--importance`. Both accept `--json` for scripting.

```bash
shipeasy ops bug "Checkout button overlaps footer" \
  --steps "1. Add item to cart. 2. Resize below 1024px." \
  --actual "Button hidden behind sticky footer" \
  --expected "Button stays visible above the footer"

shipeasy ops feature "Dark mode dashboard" \
  --description "System-prefers dark theme for the dashboard chrome" \
  --use-case "Reviewing the ops queue at night" \
  --importance important
```

## MCP server

| Command                              | Description                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `shipeasy mcp install`   | Patch the right config file for Claude Code, Cursor, Windsurf, or a custom MCP client.     |
| `shipeasy mcp status`    | Show the current MCP registration state for the detected client.                           |
| `shipeasy mcp uninstall` | Remove the registration.                                                                   |
| `shipeasy mcp status`    | Run the MCP server in the foreground. Used by the install command — rarely needed by hand. |

See [MCP server](https://docs.shipeasy.ai/get-started/mcp) for the tool inventory.

## Agent skills & plugins

There is no separate `skills` or `plugin` install command — `shipeasy setup`
does it. It detects every coding agent in your environment (Claude Code,
Cursor, OpenAI Codex, GitHub Copilot, Google Jules) and wires each the way
that agent expects: the Claude Code marketplace plugin (commands + skills +
MCP) for Claude, and the agent's own instructions file
(`.cursor/rules/shipeasy.mdc`, `AGENTS.md`, `.github/copilot-instructions.md`)
plus `@shipeasy/mcp` registration for the rest.

```bash
shipeasy setup                              # detect + wire every agent found
shipeasy setup --yes --agents claude,cursor # non-interactive subset
```

`setup` is idempotent — re-run it as you add agents.

## Environment variables

- `SHIPEASY_CLI_TOKEN` (string) — Long-lived admin token used in CI. Bypasses interactive `shipeasy login`.
- `SHIPEASY_API_BASE_URL` (string) — Override the admin API base URL (default `https://shipeasy.ai`).
- `SHIPEASY_APP_BASE_URL` (string) — Override the Shipeasy dashboard base URL the CLI links to from its device-auth output (default `https://shipeasy.ai`).
- `SHIPEASY_PROJECT_ID` (string) — Default project id when no `--project` flag is passed.
- `NO_COLOR` (any) — Disable ANSI colour output.

## Exit codes

`0` on success, `1` on any error. JSON output goes to stdout; human-readable progress goes to stderr — pipes work the way you'd expect.

```bash
shipeasy release flags list | jq '.[] | select(.enabled == true) | .name'
```

## Examples

```bash
# Create a feature flag, set targeting, roll out to 5%, then promote to 100%.
shipeasy release flags create checkout-v2 --rules '[{"attr":"plan","op":"eq","value":"pro"}]'
shipeasy release flags update checkout-v2 --rollout-percent 5
shipeasy release flags update checkout-v2 --rollout-percent 100

# File a bug from CI when a smoke test fails.
SHIPEASY_CLI_TOKEN="$CI_TOKEN" shipeasy ops bug "Smoke test failed on deploy" \
  --steps-to-reproduce "See CI run" --priority high
```

> **Pipe-friendly by design**

Every read command accepts `--json`. Every write command exits non-zero on failure. The CLI is
built to be scripted — drop it into a Makefile or a GitHub Actions step and it behaves the way
you'd expect.

**Related**

- [CLI reference](https://docs.shipeasy.ai/get-started/cli-reference) — Every command, argument and flag
- [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) — One login for the CLI and every MCP tool
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — The same operations, driven by an agent
- [Scheduled triggers](https://docs.shipeasy.ai/get-started/triggers) — Run it unattended, on a cadence
