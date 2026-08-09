# Install in your agent

Source: https://docs.shipeasy.ai/get-started/agents

> One plugin tree, every coding agent. Install Shipeasy's skills and MCP server into Claude Code, Codex, Copilot CLI, Cursor, Windsurf, Cline, Gemini and more.

Shipeasy ships a set of agent **skills** (`flags`, `metrics`, `alerts`, `ops`, `see`, `setup`, `migrate`) and the **`shipeasy` MCP server** (`npx -y @shipeasy/mcp@latest`). The skills auto-trigger on natural-language phrasing and walk your agent through each workflow; the MCP server is the typed toolkit that actually creates feature flags, defines metrics, raises alert rules, and files feedback.

Everything lives **once** in the [`shipeasy-ai/shipeasy`](https://github.com/shipeasy-ai/shipeasy) marketplace repo and is _referenced_ per host — nothing is duplicated per agent. There are two install tiers.

## Tier 1 — native plugin (one command)

These hosts have a plugin system, so a single install bundles skills + MCP. (Claude Code additionally gets the `/shipeasy:<area>:<verb>` slash commands — no other host has a plugin slash-command primitive.)

**Claude Code**

```bash title="Claude Code"
claude plugin marketplace add shipeasy-ai/shipeasy
claude plugin install shipeasy@shipeasy
```

**GitHub Copilot CLI**

```bash title="GitHub Copilot CLI"
copilot plugin marketplace add shipeasy-ai/shipeasy
copilot plugin install shipeasy@shipeasy
```

**Codex**

For **Codex**, add the source from inside the TUI (`/plugins` opens the browser):

```text title="Codex (TUI)"
/plugin marketplace add shipeasy-ai/shipeasy
/plugin install shipeasy@shipeasy
```

On Codex and Copilot, invoke the plugin explicitly with `@shipeasy`, or just describe the task and let a skill trigger.

## Tier 2 — skills + MCP (OpenCode, Cursor, Windsurf, …)

Every other agent installs in two steps.

**Step 1 — skills.** [`vercel-labs/skills`](https://github.com/vercel-labs/skills) copies our `SKILL.md` files into the agent's skills directory. Point it at the plugin subpath so it finds our `skills/` folder:

```bash
npx skills add https://github.com/shipeasy-ai/shipeasy/tree/main/shipeasy -a <agent>
```

`<agent>` is `opencode`, `cursor`, `windsurf`, `cline`, `gemini-cli`, `continue`, `openclaw`, `github-copilot`, … (`--agent '*'` installs into all 70+ supported agents). Add `-g` for the user-global skills dir.

> **Note**

The `skills` CLI handles skill text only — it does not register MCP servers. Do Step 2 separately.

**Step 2 — MCP server.** Add `shipeasy` to the agent's MCP config. Most agents use the standard `mcpServers` object; pick your host:

**Cursor**

```json title="Cursor — .cursor/mcp.json (or ~/.cursor/mcp.json)"
{
  "mcpServers": {
    "shipeasy": {
      "command": "npx",
      "args": ["-y", "@shipeasy/mcp@latest"]
    }
  }
}
```

**Windsurf / Gemini CLI / Cline**

The same `mcpServers` block works for **Windsurf** (`~/.codeium/windsurf/mcp_config.json`), **Gemini CLI** (`~/.gemini/settings.json`, or run `gemini mcp add shipeasy npx -y @shipeasy/mcp@latest`), and **Cline** (open _Configure MCP Servers_ → `cline_mcp_settings.json`).

```json
{
  "mcpServers": {
    "shipeasy": {
      "command": "npx",
      "args": ["-y", "@shipeasy/mcp@latest"]
    }
  }
}
```

**OpenCode**

**OpenCode** uses a `mcp` key with `type: "local"` and the command as an array (skills also auto-discover from `.agents/skills/`, so Step 1 just works):

```json title="OpenCode — opencode.json"
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "shipeasy": {
      "type": "local",
      "command": ["npx", "-y", "@shipeasy/mcp@latest"],
      "enabled": true
    }
  }
}
```

**Continue**

**Continue** uses a YAML list (and MCP only runs in _agent_ mode):

```yaml title="Continue — .continue/config.yaml"
mcpServers:
  - name: shipeasy
    type: stdio
    command: npx
    args:
      - "-y"
      - "@shipeasy/mcp@latest"
```

> **Note**

Windows / Cline `spawn npx ENOENT`: wrap the command as `"command": "cmd", "args": ["/c", "npx",
"-y", "@shipeasy/mcp@latest"]`.

## After install (any host)

Installing only _registers_ the skills + MCP — it runs no shell commands. To wire Shipeasy into your app:

1. **Authenticate + bind.** Claude Code: run `/shipeasy:setup`. Anywhere else: tell the agent _"set up shipeasy in this repo"_ — the `setup` skill runs `shipeasy login`, binds the repo to a project, mints server + client keys, and wires the SDK into your root layout.
2. **Enable the modules you want** — flags + configs + events, or feedback + errors + alerts.

## What ports to each host

| Capability                   | Claude Code | Codex | Copilot CLI | OpenCode, Cursor, … |
| ---------------------------- | :---------: | :---: | :---------: | :-----------------: |
| Seven skills                 |     ✅      |  ✅   |     ✅      |         ✅          |
| `shipeasy` MCP server        |     ✅      |  ✅   |     ✅      |         ✅          |
| `/shipeasy:*` slash commands |     ✅      |   —   |      —      |          —          |
| One-command install          |     ✅      |  ✅   |     ✅      |      two steps      |

Slash commands are the only Claude-Code-exclusive surface. Everything that _does_ the work — creating feature flags, defining metrics, raising alerts, filing feedback — runs through the MCP server, which every host has.

## No MCP, no plugin

An agent that can only fetch a URL still gets everything. [`/agents.md`](https://docs.shipeasy.ai/agents.md) is this documentation's setup path stitched into one file, ending in every CLI command and every MCP tool by name — which is the part that stops an agent inventing a command that doesn't exist. See [Docs for agents](https://docs.shipeasy.ai/get-started/llms) for that and the two other bundles

**Related**

- [Docs for agents](https://docs.shipeasy.ai/get-started/llms) — llms.txt, the full corpus, the setup runbook
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — what the tools do
- [Scheduled triggers](https://docs.shipeasy.ai/get-started/triggers) — unattended agent runs
