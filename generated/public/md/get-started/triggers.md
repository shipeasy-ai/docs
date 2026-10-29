# Scheduled triggers

Source: https://docs.shipeasy.ai/get-started/triggers

> Provision a scheduled agent that runs the shipeasy-ops-work skill on a cadence, burning down the feedback queue one PR at a time — on Claude Code, Cursor, Copilot and more.

A **trigger** is an _unattended, scheduled_ agent run. On a cron cadence it runs **`/shipeasy:shipeasy-ops-work --pr`** against your project — burning down the feedback queue (bugs, feature requests, auto-filed error/alert tickets) one item at a time, committing each fix on its own branch, and opening **one PR per item** for review. No human in the loop.

Provision it from the CLI:

```bash
shipeasy setup triggers
shipeasy setup triggers --platform claude
```

`--platform` is one of `claude`, `codex`, `cursor`, `copilot`, `gemini`, `jules`. The command
explains the trade, has you pick a platform, then opens the guided setup on the dashboard's
**Triggers** tab preselected to it — the same surface that manages the trigger afterwards.
`shipeasy setup` offers this as an inline step.

> **Note**

Every provider schedules the **same work** — only what *schedules* it, and how the run is
launched and authenticated, differs. The low-level plumbing is still there if you want it:
`shipeasy ops trigger create <provider> --help` and `shipeasy ops trigger prep`.

## Three scheduler tiers

| Tier                              | Platforms                              | Mechanism                                                                          |
| --------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| **A — Shipeasy fires it**         | `claude`, `cursor`, `copilot`, `jules` | Shipeasy's own cron starts the run over HTTPS — your machine can be off            |
| **B — scheduled on the platform** | `codex`                                | a GitHub Actions `schedule:` job submits a Codex Cloud task                        |
| **C — headless + external cron**  | `gemini`                               | non-interactive run mode driven by system cron or a GitHub Actions `schedule:` job |

| `--platform` | Scheduler                                                                       | Launch / auth                                                     |
| ------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `claude`     | `/schedule` cloud routine                                                       | runs `shipeasy-ops-work --pr`; **registers a Shipeasy connector** |
| `cursor`     | Shipeasy cron → `POST https://api.cursor.com/v1/agents`                         | `autoCreatePR`; `CURSOR_API_KEY`                                  |
| `copilot`    | Shipeasy cron → GitHub coding-agent task via `.github/agents/shipeasy.agent.md` | **Connect GitHub** (user-to-server token); PAT fallback           |
| `jules`      | Shipeasy cron → Jules session                                                   | Jules API key                                                     |
| `codex`      | Actions `schedule:` job (`.github/workflows/shipeasy-trigger.yml`)              | `codex cloud exec`; `CODEX_API_KEY` + `CODEX_ENV_ID`              |
| `gemini`     | Actions `schedule:` (run-gemini-cli)                                            | `gemini -p --approval-mode=yolo`                                  |

## The run is identical everywhere

Whatever the provider, the scheduled run authenticates with a restricted **`ops`** key, refreshes the plugin + CLI, and follows the installed `shipeasy-ops-work --pr` workflow. Mint the key with:

```bash
npx -y @shipeasy/cli@latest sdk keys create --type ops
```

The `ops` key can read the queue, flip item status, link the PR it opens, and create resources — but never edits or deletes existing ones, and auto-extends its 7-day expiry on each run. A leaked trigger prompt can't compromise the project. **Never embed your admin login token.**

## Set up each agent

Every card under **Settings → Triggers** links to its own section below, and each one matches the
guided dialog behind that card step for step.

### Claude Code [#claude]

Shipeasy fires a Claude Code **routine** running in Anthropic's cloud, so your machine can be off.
Create a routine with `/schedule` in Claude Code (prompt: `Run /shipeasy:shipeasy-ops-work --pr`),
then paste the routine id and its web-UI fire token into **Connect**. Shipeasy registers a connector,
so **Trigger now** and auto-fire on new queue items work from the dashboard.

### Cursor [#cursor]

Shipeasy cold-launches a Cursor cloud agent that opens a PR. **Connect** asks for a repo and a Cursor
API key; Shipeasy mints its own `ops` key and injects it into the run as `SHIPEASY_CLI_TOKEN`, so
there is nothing to configure in Cursor.

### GitHub Copilot [#copilot]

Shipeasy starts a Copilot coding-agent task through the custom agent file
`.github/agents/shipeasy.agent.md`. GitHub only lets a user token start a task: **Connect GitHub**
authorizes the Shipeasy app as you, or paste a Copilot-licensed fine-grained PAT with the **Agent
tasks** permission. The `ops` key lives in the repo's GitHub Agents secret store.

### Gemini (Jules) [#jules]

Shipeasy starts a Google Jules session that opens a PR. **Connect** needs the Jules source (your
repo), a Jules API key, and a restricted `ops` key, which is embedded in the prompt because Jules
has no environment-variable channel. For headless Gemini CLI runs on your own cron, see
[Tier C](#tier-c--the-github-actions-shape-gemini) below.

### Codex [#codex]

Codex Cloud exposes no API Shipeasy can fire, so the trigger is a scheduled GitHub Actions job in
your repo. The **Connect** dialog picks the repo and opens a PR that adds this file (or you commit it
yourself):

```yaml title=".github/workflows/shipeasy-trigger.yml"
name: Shipeasy trigger (Codex)
on:
  schedule:
    - cron: "0 */4 * * *" # every 4 hours - pick your own cadence
  workflow_dispatch: {}
jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - run: npm install -g @openai/codex
      - name: Submit a Codex Cloud task
        env:
          CODEX_API_KEY: ${{ secrets.CODEX_API_KEY }}
        run: codex cloud exec --env ${{ secrets.CODEX_ENV_ID }} "Run /shipeasy:shipeasy-ops-work --pr for this project and follow that workflow exactly - one item at a time, one PR per item."
```

Add two repo secrets: **`CODEX_API_KEY`** (authenticates the Codex CLI) and **`CODEX_ENV_ID`** (the
Codex Cloud environment). Set network access and your Shipeasy `ops` key on that environment, on the
Codex Cloud environments page. Codex Automations run locally in the Codex app, so they only fire
while your machine is on; use the workflow above for an unattended trigger.

### Muse [#muse]

Meta Muse has no connector form. **Instructions** gives you a canned prompt that carries this
project's MCP URL; paste it into Muse and Muse builds the custom connector on its side. Shipeasy never
sees a connection, so the card has no connected state, and scheduling is whatever you configure in
Muse. Muse pulls docs with `docs_list`, `docs_get` and `docs_skill`, then works the queue with
`ops_list`.

### Other / any MCP tool [#other]

Any MCP-compatible tool can drive the same queue. See
[Remote server for coding assistants](https://docs.shipeasy.ai/get-started/mcp#remote-server-for-coding-assistants-oauth)
for the config, and the card's dialog for the client details. Scheduling and connection state live
entirely on your side for this card.

## Tier C — the GitHub Actions shape (Gemini) [#tier-c--the-github-actions-shape-gemini]

For a headless agent with no native scheduler, a scheduled Actions workflow is the always-on driver. This example is **Gemini**, via the official [`run-gemini-cli`](https://github.com/google-github-actions/run-gemini-cli) Action; [Codex](#codex) has its own workflow and secret set above:

```yaml title=".github/workflows/shipeasy-feedback-trigger.yml"
on:
  schedule:
    - cron: "0 9 * * 1-5" # weekdays 09:00 UTC
  workflow_dispatch:
permissions:
  contents: write
  pull-requests: write
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: google-github-actions/run-gemini-cli@v0
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          SHIPEASY_CLI_TOKEN: ${{ secrets.SHIPEASY_OPS_KEY }}
          SHIPEASY_PROJECT_ID: ${{ secrets.SHIPEASY_PROJECT_ID }}
        with:
          prompt: "<trigger prompt>"
          settings: '{ "approval-mode": "yolo" }'
```

> **Note**

Unattended runs use an auto-approve flag (`--approval-mode=yolo`, `--sandbox danger-full-access`,
`--dangerously-skip-permissions`) that removes the human gate — run only in an isolated env. They
also spend tokens/credits on every fire, so start with a weekly or daily cron and watch the first
runs. PRs land for review; nothing auto-merges.

## Mention an agent in a comment [#mentions]

Besides running on a schedule, a connected agent can be started by hand: write its handle in a
comment on a queue item — `@claude`, `@cursor`, `@copilot` or `@jules` — and Shipeasy hands the item
to that agent. It marks your comment as seen with a 👀 reaction and the agent picks the work up,
exactly as a scheduled run would. A second mention while that agent's run is still open adds
instructions to it rather than starting from scratch.

> **Off by default**

A mention starts a real run, which spends your own Claude, Cursor, Copilot or Jules quota, so it
is a project-level choice and **starts off**. Turn it on under **Settings → Ops → Mentions →
Mentioning an agent starts a run**. While it is off, a mention stays a plain reference in the
comment.

A mention can only start an agent that is connected — set one up under **Settings → Triggers**
first. The Mentions row lists which are connected right now. Codex, Muse and other MCP tools have no
mention: they pull work from the queue themselves, so there is no run for Shipeasy to start.

`@shipeasy` is different — it asks the built-in assistant to read the item and reply in the thread,
and is not governed by the setting above.

## Connector registration — Shipeasy-fired vs. platform-scheduled

A Shipeasy **connector** (Settings → Triggers, "Trigger now" + event auto-fire) means **Shipeasy's
own cron fires the run**. That backend is a Cloudflare Worker, so it can only fire a provider that
exposes (1) a clean HTTP "start a run" endpoint — a plain `fetch()`, no CLI binary, no local
scheduler — and (2) a storable static token.

Four providers clear that bar and are registered as trigger connectors:

- **`claude`** — `POST …/routines/<id>/fire` with a per-routine bearer token.
- **`cursor`** — `POST https://api.cursor.com/v1/agents` with `CURSOR_API_KEY` + `autoCreatePR`.
- **`copilot`** — a GitHub coding-agent task, via the GitHub connection you already made.
- **`jules`** — a Jules session started from its API key.

Each gets a guided flow and a **Trigger now** button on the dashboard, plus auto-fire on new queue
items. `codex` and `gemini` are **platform-scheduled**: they run on their own surface (Codex
Automations, or a GitHub Actions `schedule:` job), so pause, run and inspect them there.

> **Note**

Rule of thumb: if a provider can't be started from nothing by one authenticated HTTP call,
Shipeasy can't fire it — it schedules on the provider's own platform instead.

**Related**

- [CLI](https://docs.shipeasy.ai/get-started/cli) — The command a trigger runs
- [Install in your agent](https://docs.shipeasy.ai/get-started/agents) — The agent side of the same setup
- [Configure alerts](https://docs.shipeasy.ai/metrics/alerts) — What files the work a trigger burns down
- [Team & permissions](https://docs.shipeasy.ai/get-started/team) — What an unattended run may publish
