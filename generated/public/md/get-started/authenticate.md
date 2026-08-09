# Authenticate

Source: https://docs.shipeasy.ai/get-started/authenticate

> One `shipeasy login` opens your browser, signs in the CLI and every MCP tool on your machine, and quietly refreshes itself for 30 days.

Shipeasy uses an OAuth-style PKCE device-auth flow. Run one command, click one link in your browser, and the CLI plus every MCP tool on your machine is signed in. There is no API key to copy, paste, or rotate — for interactive use.

For CI, you swap the device-auth flow for a long-lived `SHIPEASY_CLI_TOKEN` env var. Same code paths underneath; different credential source.

## Log in

shipeasy login

\n→ Opening https://shipeasy.ai/auth/cli/abc123 in your browser...\n→ Waiting for the
browser flow to complete...\n✔ Authenticated as you@example.com (project: acme)\n✔
Credentials saved to ~/.shipeasy/credentials

Your browser opens to a confirmation page. Sign in with GitHub, Google, or a magic link. When you confirm, the CLI command exits with success and the credentials are saved to `~/.shipeasy/credentials` (mode `0600`).

> **No environment variables required**

Once you've logged in, every CLI command and every MCP tool call picks up your credentials
automatically. You can still set `SHIPEASY_CLI_TOKEN` if you prefer — it always wins over the file
— but interactive use never needs it.

## Under the hood — device-auth flow

**CLI requests a device code**

The CLI calls `POST /auth/device/code` on the Shipeasy, which returns a short `device_code`, a
longer `user_code`, and a `verification_uri`.

**CLI opens the browser**

The CLI prints the URL and tries to open it (`open`/`xdg-open`/`start`). If your terminal is
headless, the URL is shown for you to paste.

**You confirm in the browser**

You sign in (or you're already signed in to the dashboard) and click **Confirm**. The
browser hits `POST /auth/device/confirm` with the `device_code` and your session.

**CLI polls for completion**

The CLI polls `POST /auth/device/token` every couple of seconds. Once the browser confirms, the
response includes an `access_token` (1h) and a `refresh_token` (long-lived, rotates on use).

**Credentials are written to disk**

The token pair lands in `~/.shipeasy/credentials`. Future CLI calls use the access token; if
it's expired, the CLI refreshes transparently before the call.

There is no plaintext password anywhere on disk. PKCE means an attacker who steals the URL still can't complete the flow without your verifier.

## Pick a project

If your account has access to more than one project, the login flow lets you choose one. To switch later:

```bash
shipeasy whoami            # show the active project + accessible projects
shipeasy bind <project_id> # bind the cwd to a project (writes .shipeasy)
shipeasy login --project <project_id>  # re-auth scoped to a different project
```

For one-off overrides on a single command, every CLI subcommand accepts a `--project <id>` flag:

```bash
shipeasy release flags list
```

The order of precedence is: `--project` flag > `.shipeasy` file in the cwd > the project bound during `shipeasy login`.

## Multiple orgs

Each Shipeasy project belongs to one org. If you're in several orgs, projects from all of them show up in `shipeasy whoami` output. There is no separate `org switch` — the project is the authoritative scope and the org is implied by the project ID.

## Log out

```bash
shipeasy logout
```

This wipes `~/.shipeasy/credentials`. You'll need to `login` again before the next CLI or MCP call.

To revoke the **server-side** session (e.g. you suspect the credential file leaked), use `shipeasy logout`. This calls the admin API to invalidate the refresh token before deleting the local file. After this, even an attacker with the credential file can't obtain new access tokens.

## Token rotation

Refresh tokens rotate on every use. The pattern is:

1. CLI sees the access token is expired (or about to be).
2. CLI calls `POST /auth/device/refresh` with the current refresh token.
3. The server returns a **new** access token and a **new** refresh token, and invalidates the old refresh token.
4. The CLI writes the new pair to disk before doing anything else.

This means a stolen refresh token is good for at most one refresh — the moment you next use the CLI on your laptop, the attacker's copy stops working.

## Using Shipeasy in CI

For GitHub Actions, GitLab CI, and any non-interactive environment, generate a long-lived **API token** in **Project → Tokens → Create** and pass it as `SHIPEASY_CLI_TOKEN`:

```yaml title=".github/workflows/release.yml"
- name: Check the flags this release depends on
  env:
    SHIPEASY_CLI_TOKEN: ${{ secrets.SHIPEASY_CLI_TOKEN }}
  run: shipeasy release flags list --json
```

API tokens skip the device-auth flow entirely. They're scoped to one project, can be marked **read-only** or **read-write**, and can be revoked with one click.

> **Scope and rotate your CI tokens**

Read-write API tokens can change anything in the project. Treat them like any other production
secret: store in your CI vault, rotate on a schedule, scope to the smallest project that works,
and never commit them. `shipeasy sdk keys list` and `shipeasy sdk keys revoke` let you audit and
revoke at any time.

## SDK keys vs API tokens — pick the right one

- `Server SDK key` (server runtime) — Read-only. Lets the server SDK fetch the rule blobs and ship exposure events. Cannot mutate.
- `Client SDK key` (browser runtime) — Read-only and scoped — exposes only flags/configs marked client-readable. Domain-rate-limited.
- `API token` (CLI / CI / programmatic) — Acts as a user. Read-only or read-write. Use these for CI, scripts, and human terminals (via `shipeasy login`).

A common mistake is to use an API token in the SDK at runtime. Don't — they're much more powerful than they need to be, and they don't enforce per-domain rate limits. Use SDK keys for the SDK, API tokens for everything else.

## What gets stored on your machine

```
~/.shipeasy/credentials   # mode 0600, JSON
├─ access_token           # short-lived (1h), refreshed automatically
├─ refresh_token          # long-lived, rotates on every use
├─ project_id             # active project
├─ user_email             # for `whoami`
└─ created_at             # when this credential set was issued
```

The credentials file is the only state the CLI writes. Project/env preferences live alongside in `~/.shipeasy/config.json`. Neither file should ever be committed.

## Troubleshooting

> **`shipeasy login` opens the wrong browser**

Set `BROWSER=firefox` (or your browser of choice). The CLI honours the standard `BROWSER` env var.

> **`shipeasy login` hangs in a remote SSH session**

Pass `--no-browser` to print the URL instead of opening it. Open the URL on your local machine,
confirm, and the CLI in the SSH session completes when the poll succeeds.

> **MCP tools say `not authenticated`**

Run `shipeasy login` in a real terminal first. The MCP server reads the same
`~/.shipeasy/credentials` file the CLI writes. Some agents launch with a stripped env — set `HOME`
explicitly in your MCP config if the tool can't find the file.

**Related**

- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — The keys your app uses, not the CLI
- [CLI](https://docs.shipeasy.ai/get-started/cli) — What the session unlocks
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — The same login, for your agent
- [Team & permissions](https://docs.shipeasy.ai/get-started/team) — Who may publish to production
