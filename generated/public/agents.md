# Shipeasy — setup runbook for coding agents

Generated from https://docs.shipeasy.ai — do not edit by hand. Regenerate with `pnpm gen:llms`.

Read this top to bottom to take a repo from nothing to a flag serving traffic,
metrics recording, and alerts wired. Each part below is a documentation page,
reproduced whole, ordered the way the work is actually done rather than the way
the nav groups it. The source URL is on every part.

If you only need one thing, jump by heading. If you need something not covered
here, the index at https://docs.shipeasy.ai/llms.txt lists every page, and
https://docs.shipeasy.ai/llms-full.txt is the whole corpus in one file.

## Contents

1. Install — https://docs.shipeasy.ai/get-started/install
2. Authenticate — https://docs.shipeasy.ai/get-started/authenticate
3. Keys & environments — https://docs.shipeasy.ai/get-started/keys-and-environments
4. Quickstart (get-started) — https://docs.shipeasy.ai/get-started/quickstart
5. Install in your agent — https://docs.shipeasy.ai/get-started/agents
6. MCP server — https://docs.shipeasy.ai/get-started/mcp
7. CLI — https://docs.shipeasy.ai/get-started/cli
8. Quickstart (flags/gates) — https://docs.shipeasy.ai/flags/gates/quickstart
9. Quickstart (flags/configs) — https://docs.shipeasy.ai/flags/configs/quickstart
10. Quickstart (flags/killswitches) — https://docs.shipeasy.ai/flags/killswitches/quickstart
11. Quickstart (metrics) — https://docs.shipeasy.ai/metrics/quickstart
12. Getting started (feedback) — https://docs.shipeasy.ai/feedback/getting-started
13. Scheduled triggers — https://docs.shipeasy.ai/get-started/triggers
14. Troubleshooting — https://docs.shipeasy.ai/get-started/troubleshooting

---

## Install

Source: https://docs.shipeasy.ai/get-started/install

Add the Shipeasy SDK to your application, the CLI to your machine, and (optionally) the MCP server to your AI assistant.

Shipeasy ships as a small set of npm packages — install only the ones you need. There is one SDK, one CLI binary, and one MCP server. They all share the same login.

### Pick what you need

- **[@shipeasy/sdk](#sdk)** — The core SDK. Conditional exports pick the right build for your runtime — Node, Workers, Bun, Deno, or browser.

- **[@shipeasy/cli](#cli)** — The <code>shipeasy</code> command. Login, manage flags, configs and kill switches, work the ops queue, install the MCP server.

- **[@shipeasy/mcp](#mcp)** — MCP server for AI assistants. Installed via the CLI — your agent gets a typed toolkit.

- **[Framework adapters](#frameworks)** — Idiomatic wrappers around the browser SDK. Hooks, composables, stores, directives.

### Quick install

```bash
npm install @shipeasy/sdk
```

```bash
npm install -g @shipeasy/cli
shipeasy login
```

That's the whole runway from zero to working. Everything below is detail.

### SDK [#sdk]

**Install the package**

Pick your language — every tab pulls the install/registry line straight from that SDK's [reference page](https://docs.shipeasy.ai/sdks).

**TypeScript**

```bash
npm install @shipeasy/sdk
```

The package ships **both** server (Node, Workers, Bun, Deno) and browser builds via conditional exports. Your bundler picks the right one automatically; you can also import the explicit subpath (`/server`, `/client`) when you want to be unambiguous (e.g. inside a monorepo with a shared util used from both).

**Python**

```bash
pip install shipeasy
```

**Go**

```bash
go get github.com/shipeasy-ai/sdk-go
```

**Ruby**

```ruby
## Gemfile
gem "shipeasy"
```

**Java**

```xml
<dependency>
  <groupId>ai.shipeasy</groupId>
  <artifactId>shipeasy</artifactId>
  <version>0.1.0</version>
</dependency>
```

**Kotlin**

```kotlin
implementation("ai.shipeasy:shipeasy-kotlin:0.3.0")
```

**PHP**

```bash
composer require shipeasy/sdk
```

**Swift**

```swift
dependencies: [
    .package(url: "https://github.com/shipeasy-ai/sdk-swift.git", from: "0.1.0"),
]
```

**Server initialisation**

For Next.js, put this in your root `layout.tsx` so it runs once per cold start. For an Express or  app, call it during startup. For RSC, the SDK persists state across the async-context boundary so you don't need a Provider on the server side.

```ts
import { configure } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan }),
});
```

The single `configure()` call boots flags, configs **and** kill switches. The optional `attributes` transform maps your user object onto the Shipeasy attribute map, so every bound `Client` you construct evaluates against the right context. The server SDK polls `/sdk/flags` and `/sdk/experiments` in the background. Evaluation happens **locally** — there is no per-request network call from your code. Env (dev / staging / prod) is **derived from the key**: each key is bound to exactly one environment when you mint it, so you deploy the prod key to prod and the staging key to staging — there is nothing to set in code. (A server key may still override per request with `?env=` for local debugging; client keys cannot — see below.)

**Browser initialisation**

```ts
import { configure, Client } from "@shipeasy/sdk/client";

configure({
  clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan }),
});

// Once you know who the user is, bind a client and await freshness:
const flags = new Client(currentUser);
await flags.ready();
```

The client SDK auto-manages an `anonymous_id` cookie, batches event uploads with `navigator.sendBeacon` on page hide, and exposes a [devtools overlay](https://docs.shipeasy.ai/get-started/sdks#devtools) at `?shipeasy=1`.

The client key is public — it ships in your browser bundle. Its environment is **locked to the key** and cannot be changed at runtime, so a client key minted for `staging` can only ever read `staging` flags and configs. Use a **separate client key per environment**; never share one across environments expecting isolation.

**One key, one configure call**

Flags, configs, and kill switches share a single key per side (`apiKey` on the server, `clientKey` in the browser). There is no second configure step — the single `configure()` call boots all of them.

Don't wrap this in a custom helper file. The SDK owns its own initialisation.

> **Two kinds of keys — server vs client**

**Server keys** can read full payloads and write events. **Client keys** are scoped: they expose
only the feature flags and configs you mark _client-readable_, and they rate-limit by domain.
Never put a server key in browser code. Manage both in **Project → SDK keys**, or with `shipeasy
keys`.

### CLI [#cli]

**Install globally**

```bash
npm install -g @shipeasy/cli
```

Or skip the install and use it ad-hoc:

```bash
npx -y @shipeasy/cli@latest --help
```

**Verify**
```bash shipeasy --version shipeasy --help ```

**Log in**

```bash
shipeasy login
```

Opens a browser to confirm. After confirmation, credentials are written to `~/.shipeasy/credentials` (mode `0600`). See [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) for the full flow including CI tokens.

The CLI is a thin wrapper over the same Server Actions the dashboard uses. Anything you can do in the UI, you can do from a terminal or a CI job. Full reference at [CLI](https://docs.shipeasy.ai/get-started/cli).

### MCP server [#mcp]

If you use Claude Code, Cursor, Windsurf, or any other MCP-compatible AI assistant, install the Shipeasy MCP server so your agent can do setup work for you:

shipeasy mcp install

\n? Which assistants? › Claude Code, Cursor\n✔ Wrote ~/.claude/settings.json\n✔
Wrote .cursor/mcp.json\nMCP server registered. Restart your AI assistant to pick it up.

The MCP server uses your CLI credentials — no extra env vars, no separate token. See [MCP server](https://docs.shipeasy.ai/get-started/mcp) for the tool inventory and manual config.

### Environment variables

The SDK reads the following from `process.env` (and `import.meta.env` in Vite). Anything passed explicitly to `configure({ ... })` wins.

- `SHIPEASY_SERVER_KEY` (string) — Server-side SDK key. Used by the server build. Treat as a secret.
- `NEXT_PUBLIC_SHIPEASY_CLIENT_KEY` (string) — Client-side SDK key. Safe to expose. Vite users: `VITE_SHIPEASY_CLIENT_KEY`.
- `SHIPEASY_API_BASE_URL` (string) — Override the admin API base URL (CLI default `https://shipeasy.ai`).
- `SHIPEASY_APP_BASE_URL` (string) — Override the dashboard URL the CLI links to (default `https://shipeasy.ai`).

### Frameworks [#frameworks]

- **[Node · Workers · Bun · Deno](https://docs.shipeasy.ai/get-started/sdks#server)** — `@shipeasy/sdk/server` works in any V8/Node-compatible runtime out of the box.

- **[React, Vue, Svelte, Angular](https://docs.shipeasy.ai/get-started/sdks#frameworks)** — Per-framework adapters that wrap the browser SDK with idiomatic primitives.

- **[React Native, iOS, Android](https://docs.shipeasy.ai/get-started/sdks#mobile)** — Use the server build — it has zero DOM dependencies.

- **[Ruby, Python, Go](https://docs.shipeasy.ai/get-started/sdks#ruby)** — The Ruby gem ships today. Python and Go are in beta — ping us for access.

### Edge runtimes & ESM

The SDK is shipped as ESM-first with a CJS fallback for older Node. There are no Node built-ins on the hot path, so it runs unchanged on Shipeasy, Vercel Edge, Deno Deploy, and Bun.

> **Conditional exports cheat sheet**

- `import { configure, Client } from "@shipeasy/sdk/server"` — server build, picked automatically when bundling for Node/Workers. - `import { configure, Client } from "@shipeasy/sdk/client"` — browser build, picked when bundling for the browser. - `import "@shipeasy/sdk"` — re-exports both via conditional resolution. Use this only if your bundler honours `exports`.

### Monorepo notes

In a pnpm/yarn workspace, install `@shipeasy/sdk` in each app that uses it (don't hoist it into the root unless your tooling resolves hoisted deps). For shared internal libraries that import from the SDK, depend on it as a `peerDependency` so consumers control the version.

If you depend on the SDK from a Cloudflare Worker built with `CLI`, no special config is needed — `CLI` honours `exports` and picks the right build.

### Troubleshooting

> **Node 18 or older**

Shipeasy requires Node 20+. Older Node versions lack stable `fetch` and `AbortSignal.timeout`. Upgrade Node, or polyfill `fetch` and pass it explicitly via `configure({ fetch: customFetch })`.

> **Edge runtime build picks the wrong file**

Some bundlers misclassify edge targets as Node. Force the right build with the explicit subpath:
`import { configure, Client } from "@shipeasy/sdk/server"` — this works in every edge runtime
we've tested.

> **Vite says "process is not defined"**

Use `import.meta.env.VITE_SHIPEASY_CLIENT_KEY` rather than `process.env.*` in Vite, and let Vite
inline it at build time. Don't pass `process.env.SHIPEASY_SERVER_KEY` to the client build —
that key belongs only on the server.

**Related**

- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — Which key goes where
- [SDKs](https://docs.shipeasy.ai/get-started/sdks) — Server build, browser build, native ports
- [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) — Sign in the CLI and your agent
- [Troubleshooting](https://docs.shipeasy.ai/get-started/troubleshooting) — When the install does not take

---

## Authenticate

Source: https://docs.shipeasy.ai/get-started/authenticate

One `shipeasy login` opens your browser, signs in the CLI and every MCP tool on your machine, and quietly refreshes itself for 30 days.

Shipeasy uses an OAuth-style PKCE device-auth flow. Run one command, click one link in your browser, and the CLI plus every MCP tool on your machine is signed in. There is no API key to copy, paste, or rotate — for interactive use.

For CI, you swap the device-auth flow for a long-lived `SHIPEASY_CLI_TOKEN` env var. Same code paths underneath; different credential source.

### Log in

shipeasy login

\n→ Opening https://shipeasy.ai/auth/cli/abc123 in your browser...\n→ Waiting for the
browser flow to complete...\n✔ Authenticated as you@example.com (project: acme)\n✔
Credentials saved to ~/.shipeasy/credentials

Your browser opens to a confirmation page. Sign in with GitHub, Google, or a magic link. When you confirm, the CLI command exits with success and the credentials are saved to `~/.shipeasy/credentials` (mode `0600`).

> **No environment variables required**

Once you've logged in, every CLI command and every MCP tool call picks up your credentials
automatically. You can still set `SHIPEASY_CLI_TOKEN` if you prefer — it always wins over the file
— but interactive use never needs it.

### Under the hood — device-auth flow

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

### Pick a project

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

### Multiple orgs

Each Shipeasy project belongs to one org. If you're in several orgs, projects from all of them show up in `shipeasy whoami` output. There is no separate `org switch` — the project is the authoritative scope and the org is implied by the project ID.

### Log out

```bash
shipeasy logout
```

This wipes `~/.shipeasy/credentials`. You'll need to `login` again before the next CLI or MCP call.

To revoke the **server-side** session (e.g. you suspect the credential file leaked), use `shipeasy logout`. This calls the admin API to invalidate the refresh token before deleting the local file. After this, even an attacker with the credential file can't obtain new access tokens.

### Token rotation

Refresh tokens rotate on every use. The pattern is:

1. CLI sees the access token is expired (or about to be).
2. CLI calls `POST /auth/device/refresh` with the current refresh token.
3. The server returns a **new** access token and a **new** refresh token, and invalidates the old refresh token.
4. The CLI writes the new pair to disk before doing anything else.

This means a stolen refresh token is good for at most one refresh — the moment you next use the CLI on your laptop, the attacker's copy stops working.

### Using Shipeasy in CI

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

### SDK keys vs API tokens — pick the right one

- `Server SDK key` (server runtime) — Read-only. Lets the server SDK fetch the rule blobs and ship exposure events. Cannot mutate.
- `Client SDK key` (browser runtime) — Read-only and scoped — exposes only flags/configs marked client-readable. Domain-rate-limited.
- `API token` (CLI / CI / programmatic) — Acts as a user. Read-only or read-write. Use these for CI, scripts, and human terminals (via `shipeasy login`).

A common mistake is to use an API token in the SDK at runtime. Don't — they're much more powerful than they need to be, and they don't enforce per-domain rate limits. Use SDK keys for the SDK, API tokens for everything else.

### What gets stored on your machine

```
~/.shipeasy/credentials   # mode 0600, JSON
├─ access_token           # short-lived (1h), refreshed automatically
├─ refresh_token          # long-lived, rotates on every use
├─ project_id             # active project
├─ user_email             # for `whoami`
└─ created_at             # when this credential set was issued
```

The credentials file is the only state the CLI writes. Project/env preferences live alongside in `~/.shipeasy/config.json`. Neither file should ever be committed.

### Troubleshooting

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

---

## Keys & environments

Source: https://docs.shipeasy.ai/get-started/keys-and-environments

Server key vs client key, where each goes, and how the read environment is derived from the key — never from a query param.

Shipeasy has exactly two kinds of SDK key. One per entrypoint, one configure call per side. Get this right and everything else — env isolation, public-bundle safety, evaluation scope — falls out for free.

### One key per entrypoint

|            | **Server key**                                | **Client key**                         |
| ---------- | --------------------------------------------- | -------------------------------------- |
| Import     | `@shipeasy/sdk/server`                        | `@shipeasy/sdk/client`                 |
| Field      | `apiKey`                                      | `clientKey`                            |
| Visibility | **Secret** — never ships to a browser         | **Public** — ships in your bundle      |
| Reads      | Full rule set (gates, configs, kill switches) | Only client-readable flags and configs |
| Writes     | Events                                        | Events, rate-limited by domain         |
| Env        | Bound to one env; may override per request    | **Locked** to its env                  |

```ts
// Server (root layout / startup) — server key ONLY, passed as apiKey
import { configure } from "@shipeasy/sdk/server";
configure({ apiKey: process.env.SHIPEASY_SERVER_KEY ?? "" });

// Client (one "use client" component at startup) — public client key ONLY
import { configure } from "@shipeasy/sdk/client";
configure({ clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "" });
```

> **Never interchange them**

Never pass `clientKey` to the server entrypoint or the server key to the client. The server key
authenticates the **full** payload and must never leave your server. A leaked server key in a
browser bundle exposes every rule you have.

### Where each key goes

**Server key → secrets**

Store it as a deploy secret: `SHIPEASY_SERVER_KEY` in your platform's env, a Cloudflare secret,
a Vercel encrypted env var. Read it with `process.env.SHIPEASY_SERVER_KEY`. It never appears in
client code or the network tab.

**Client key → public env**

Prefix it so your bundler inlines it: `NEXT_PUBLIC_SHIPEASY_CLIENT_KEY` (Next.js) or
`VITE_SHIPEASY_CLIENT_KEY` (Vite). It is meant to be public — the client key only exposes the
flags and configs you mark client-readable, and the Worker rate-limits it by domain.

**Mint and manage**

Create, rotate, and revoke keys in **Project → SDK keys**, or with `shipeasy sdk keys`. Each key
is bound to its environment **at mint time** — you pick the env when you create the key, not
when you use it.

### The read environment is derived from the key

This is the part people expect to be a config flag and it isn't. **There is no `?env=` for normal use.** The environment a key reads is baked into the key when you mint it.

- A key minted for `prod` reads `prod` flags and configs. Forever.
- A key minted for `staging` reads `staging`. Forever.

So you deploy the prod key to prod and the staging key to staging — there is nothing to set in code, and nothing a misconfigured request can override into the wrong env.

> **Why not a query param?**

Deriving env from the key makes the wrong env **unreachable** by accident. A request can't ask for
prod data with a staging key, because the key *is* the env credential. It also means a public
client key can't be coaxed into reading another environment from the browser.

#### Client keys are locked; server keys can override

|                | Per-request env override                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Client key** | No. The env is locked to the key — a `staging` client key can only ever read `staging`.                                    |
| **Server key** | Yes, for **local debugging only** — a server key may override per request (e.g. to preview another env from your machine). |

A client key is public, so allowing it to switch environments would let anyone with your bundle read any env. A server key is a trusted secret on your own infrastructure, so the per-request override is safe there — but you should still deploy the right key per environment and treat the override as a debugging convenience, not a deploy strategy.

### Env scoping

Each environment is an isolated slice of your project's rules. A flag at 100% in `staging` can be at 0% in `prod`. Use a **separate key per environment** and let the key carry the scope:

- `dev` (env) — Local development. Often the loosest rollouts — flip things on to see them.
- `staging` (env) — Pre-production. Mirror the prod rule shape; ramp ahead of prod to soak changes.
- `prod` (env) — Production. The env your real users read; ramp deliberately here.

> **One client key per environment — don't share**

Never reuse a single client key across environments expecting isolation. The key *is* the env
boundary; sharing one collapses the boundary. Mint `staging` and `prod` client keys separately and
ship each to its own build.

### SDK key environment variables

- `SHIPEASY_SERVER_KEY` (string) — Server-side key. Read by the server build. Treat as a secret; never expose it.
- `NEXT_PUBLIC_SHIPEASY_CLIENT_KEY` (string) — Client-side key. Safe to expose. Vite: `VITE_SHIPEASY_CLIENT_KEY`.

Anything passed explicitly to `configure({ ... })` wins over the environment variable.

**Related**

- [Install](https://docs.shipeasy.ai/get-started/install) — where the init calls live
- [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) — CLI login + CI tokens
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — what the key fetches
- [SDKs](https://docs.shipeasy.ai/sdks) — the same key model in every language

---

## Quickstart (get-started)

Source: https://docs.shipeasy.ai/get-started/quickstart

Install the SDK and CLI, bind a project, wire one init call, ship a flag at 0%, and ramp — in about five minutes.

One SDK, one CLI, one configure call. Create a flag at 0%, wrap your code, then ramp it from your terminal. No card required.

This is the universal path. Every product — gates, configs, kill switches, metrics — starts here, then branches. If you only read one page, read this one.

**Add the SDK and CLI**

```bash
npm install @shipeasy/sdk && npm install -g @shipeasy/cli
```

One package, server **and** browser. The CLI is the `shipeasy` binary — it logs in through your browser, so there are no env tokens to copy.

**Authenticate + bind a project**

```bash
shipeasy login
```

Opens your browser, confirms, and writes a credential file to `~/.shipeasy/credentials` (mode `0600`). Then bind the working directory to a project so every command knows where it points:

```bash
shipeasy bind my-project   # or run inside a repo that already has a binding
```

Full flow, including CI tokens, lives in [Authenticate](https://docs.shipeasy.ai/get-started/authenticate).

**Configure once, use everywhere**

```bash
// app/layout.tsx — runs once per cold start\nimport { configure } from "@shipeasy/sdk/server";\nconfigure({ apiKey: process.env.SHIPEASY_SERVER_KEY ?? "", attributes: (u) => ({ user_id: u.id, plan: u.plan }) });
```

The single `configure()` call boots flags, configs **and** kill switches. The server SDK polls the
rule set in the background and evaluates **locally** — there is no per-request network hop. Env
(dev / staging / prod) is derived from the key, not from a query param. See [Keys &
environments](https://docs.shipeasy.ai/get-started/keys-and-environments).

**Create a flag at 0%**

```bash
shipeasy release flags create checkout-v2 --rollout-percent 0
```

A flag at 0% is **off for everyone** but live in your rule set worldwide. You ship the code dark,
then ramp when you're ready. Changes propagate in under a second (see [Evaluation &
caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching)).

**Wrap code with getFlag**

```bash
import { Client } from "@shipeasy/sdk/server";\n\nconst flags = new Client(currentUser);\nif (flags.getFlag("checkout-v2")) {\n  return renderCheckoutV2();\n}\nreturn renderCheckoutV1();
```

Bind a `Client` to the current user once; the getters take no user argument and bucket against the
attributes your `configure()` transform resolved. The browser flow is identical — `new
Client(user)`, then `flags.getFlag("checkout-v2")`.

**Ramp it up**

```bash
shipeasy release flags update checkout-v2 --rollout-percent 25
```

Bump the rollout from your terminal (or the dashboard). The same deterministic bucketing means anyone in the first 25% stays in as you climb — nobody flickers out. Take it to `--rollout-percent 100` when you're confident.

### Configure and read a flag, in your language

The runway above is TypeScript. The same two moves — configure once with the **server** key, then read a flag locally — exist in every server SDK. Pick yours:

**TypeScript**

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({ apiKey: process.env.SHIPEASY_SERVER_KEY ?? "" });

const flags = new Client(currentUser);
if (flags.getFlag("checkout-v2")) {
  // ship it
}
```

**Python**

```python
import shipeasy

shipeasy.configure(api_key=os.environ["SHIPEASY_SERVER_KEY"])

flags = shipeasy.Client(current_user)
if flags.get_flag("checkout-v2"):
    ...
```

**Go**

```go
import (
    "os"

    shipeasy "github.com/shipeasy-ai/sdk-go"
)

shipeasy.Configure(shipeasy.Options{APIKey: os.Getenv("SHIPEASY_SERVER_KEY")})

flags := shipeasy.NewClient(currentUser)
if flags.GetFlag("checkout-v2") {
    // ship it
}
```

**Ruby**

```ruby
Shipeasy.configure do |c|
  c.api_key = ENV.fetch("SHIPEASY_SERVER_KEY")
end

flags = Shipeasy::Client.new(current_user)
if flags.get_flag("checkout-v2")
  # ship it
end
```

**Java**

```java
import ai.shipeasy.Shipeasy;
import ai.shipeasy.Client;

Shipeasy.configure(System.getenv("SHIPEASY_SERVER_KEY"));

Client flags = new Client(currentUser);
boolean enabled = flags.getFlag("checkout-v2");
```

**Kotlin**

```kotlin
import ai.shipeasy.configure
import ai.shipeasy.Client

configure(System.getenv("SHIPEASY_SERVER_KEY"))

val flags = Client(currentUser)
flags.getFlag("checkout-v2")
```

**PHP**

```php
use function Shipeasy\configure;
use Shipeasy\Client;

configure(getenv('SHIPEASY_SERVER_KEY'));

$flags = new Client($currentUser);
$enabled = $flags->getFlag('checkout-v2');
```

**Swift**

```swift
import Shipeasy

configure(apiKey: ProcessInfo.processInfo.environment["SHIPEASY_SERVER_KEY"]!)

let flags = try Client(currentUser)
let enabled = await flags.getFlag("checkout-v2")
```

The browser build is separate — see the client init below. For the full per-language API, each SDK has its own page under [SDKs](https://docs.shipeasy.ai/sdks).

### What just happened

**One key per side**

The server passes its key as `apiKey`; the browser passes the public key as `clientKey`. They
are never interchanged or passed together. The browser key is public and ships in your bundle;
the server key is a secret.

**Local, deterministic evaluation**

Your SDK holds the rule set in memory and buckets each unit with a cross-language `murmur3`
hash. The same user always lands in the same bucket, on every surface and in every language.

**Sub-second propagation**

Edits rebuild a KV blob and explicitly purge the CDN. Your SDK picks the change up on its next
background poll — under a second to visible.

> **Browser init looks the same**

```ts
import { configure, Client } from "@shipeasy/sdk/client";

configure({ clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "", attributes: (u) => ({ user_id: u.id, plan: u.plan }) });

const flags = new Client(currentUser);
await flags.ready();

if (flags.getFlag("checkout-v2")) {/* ship it */}

```
Same single configure call, public client key, then a user-bound `Client` whose getters take no user argument.

### Branch to your product

You have a flag ramping. Pick where to go deeper.

- **[Gates](https://docs.shipeasy.ai/flags/gates/quickstart)** — Targeting rules, per-condition rollouts, gradual ramps, and kill switches.

- **[Configs](https://docs.shipeasy.ai/flags/configs/quickstart)** — Typed JSON values you change at runtime — limits, copy, thresholds — without a deploy.

- **[Metrics & alerts](https://docs.shipeasy.ai/metrics/quickstart)** — Turn the events you already log into a number, then have a threshold rule watch it for you.

- **[Kill switches](https://docs.shipeasy.ai/flags/killswitches/quickstart)** — One switch that turns a subsystem off everywhere, without a deploy or a rollout ramp.

**Related**

- [Install](https://docs.shipeasy.ai/get-started/install) — every package, every runtime
- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — server vs client key, env scoping
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — the read path in depth
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — let your AI assistant do the setup

```

---

## Install in your agent

Source: https://docs.shipeasy.ai/get-started/agents

One plugin tree, every coding agent. Install Shipeasy's skills and MCP server into Claude Code, Codex, Copilot CLI, Cursor, Windsurf, Cline, Gemini and more.

Shipeasy ships a set of agent **skills** (`flags`, `metrics`, `alerts`, `ops`, `see`, `setup`, `migrate`) and the **`shipeasy` MCP server** (`npx -y @shipeasy/mcp@latest`). The skills auto-trigger on natural-language phrasing and walk your agent through each workflow; the MCP server is the typed toolkit that actually creates feature flags, defines metrics, raises alert rules, and files feedback.

Everything lives **once** in the [`shipeasy-ai/shipeasy`](https://github.com/shipeasy-ai/shipeasy) marketplace repo and is _referenced_ per host — nothing is duplicated per agent. There are two install tiers.

### Tier 1 — native plugin (one command)

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

### Tier 2 — skills + MCP (OpenCode, Cursor, Windsurf, …)

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

### After install (any host)

Installing only _registers_ the skills + MCP — it runs no shell commands. To wire Shipeasy into your app:

1. **Authenticate + bind.** Claude Code: run `/shipeasy:setup`. Anywhere else: tell the agent _"set up shipeasy in this repo"_ — the `setup` skill runs `shipeasy login`, binds the repo to a project, mints server + client keys, and wires the SDK into your root layout.
2. **Enable the modules you want** — flags + configs + events, or feedback + errors + alerts.

### What ports to each host

| Capability                   | Claude Code | Codex | Copilot CLI | OpenCode, Cursor, … |
| ---------------------------- | :---------: | :---: | :---------: | :-----------------: |
| Seven skills                 |     ✅      |  ✅   |     ✅      |         ✅          |
| `shipeasy` MCP server        |     ✅      |  ✅   |     ✅      |         ✅          |
| `/shipeasy:*` slash commands |     ✅      |   —   |      —      |          —          |
| One-command install          |     ✅      |  ✅   |     ✅      |      two steps      |

Slash commands are the only Claude-Code-exclusive surface. Everything that _does_ the work — creating feature flags, defining metrics, raising alerts, filing feedback — runs through the MCP server, which every host has.

### No MCP, no plugin

An agent that can only fetch a URL still gets everything. [`/agents.md`](https://docs.shipeasy.ai/agents.md) is this documentation's setup path stitched into one file, ending in every CLI command and every MCP tool by name — which is the part that stops an agent inventing a command that doesn't exist. See [Docs for agents](https://docs.shipeasy.ai/get-started/llms) for that and the two other bundles

**Related**

- [Docs for agents](https://docs.shipeasy.ai/get-started/llms) — llms.txt, the full corpus, the setup runbook
- [MCP server](https://docs.shipeasy.ai/get-started/mcp) — what the tools do
- [Scheduled triggers](https://docs.shipeasy.ai/get-started/triggers) — unattended agent runs

---

## MCP server

Source: https://docs.shipeasy.ai/get-started/mcp

Hand the docs and tools to Claude Code, Cursor, Windsurf, or any MCP-compatible AI assistant — and let it do the boring setup for you.

Shipeasy ships an MCP (Model Context Protocol) server: `@shipeasy/mcp`. Plug it into your AI coding assistant and the agent gains a typed toolkit for inspecting and changing your Shipeasy project — plus prompts that walk it through complete onboarding flows.

The MCP server is the same surface as the CLI, exposed as JSON-Schema-typed tools instead of argv. That distinction matters: a typed tool is much harder for an LLM to misuse than a free-form CLI invocation.

### Install

The CLI patches the right config file for whichever assistants you use:

shipeasy mcp install

\n? Which assistants? › Claude Code, Cursor\n✔ Wrote ~/.claude/settings.json\n✔
Wrote .cursor/mcp.json\nMCP server registered. Restart your AI assistant to pick it up.

After install, restart your assistant. The new MCP server appears under its tool list as `shipeasy`.

### Manual config

If your client isn't auto-detected, or you prefer to write the config yourself:

**Claude Code**

```json title="~/.claude/settings.json (Claude Code)"
{
  "mcpServers": {
    "shipeasy": {
      "command": "npx",
      "args": ["-y", "@shipeasy/mcp@latest"]
    }
  }
}
```

**Cursor**

```json title=".cursor/mcp.json (Cursor)"
{
  "mcpServers": {
    "shipeasy": {
      "command": "npx",
      "args": ["-y", "@shipeasy/mcp@latest"]
    }
  }
}
```

**Windsurf**

```json title=".windsurf/mcp.json (Windsurf)"
{
  "mcpServers": {
    "shipeasy": {
      "command": "npx",
      "args": ["-y", "@shipeasy/mcp@latest"]
    }
  }
}
```

For any other MCP-compatible client, write the same block to whatever config file it reads.

> **The MCP server uses your CLI credentials**

There are no environment variables to set. Run `shipeasy login` once and the MCP server picks up
`~/.shipeasy/credentials` on every tool call. No second auth flow, no shared tokens, no secrets in
`mcp.json`.

### Why typed tools beat free-form

A CLI is great for a human — short flags, terse output, easy to chain. For an LLM, a CLI is a parsing hazard. The agent has to remember the flag spelling, escape JSON correctly, and interpret the textual response.

A typed MCP tool flips that. Each tool is a named function with a JSON-Schema parameter object. The agent sees the schema, fills it, and gets a structured response back. Misuse — wrong types, missing required fields, unsupported flags — is caught at the protocol layer, not by the CLI's argv parser.

That's why the MCP server is the recommended surface for any AI-driven setup. The CLI is for humans and CI.

### Tool inventory

The server advertises its tools grouped by product area. The agent sees each one as
`mcp__shipeasy__<name>`:

| Group        | Tools                                                             | What it covers                                                           |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Release**  | `release_flags_*`, `release_configs_*`, `release_killswitch_*`    | Create, target, roll out, and kill features                              |
| **Metrics**  | `metrics_*`, `metrics_events_*`                                   | Define metrics over your events, read a series, manage the event catalog |
| **Ops**      | `ops_*`, `ops_alerts_*`, `ops_comments_*`, `ops_investigations_*` | File and work the bug / feature / alert queue, hand items to agents      |
| **Errors**   | `errors_*`                                                        | Read, group, and resolve reported production errors                      |
| **Projects** | `projects_*`, `whoami`                                            | Which project you're bound to, and its settings                          |
| **Docs**     | `docs_list`, `docs_get`, `docs_skill`                             | Fetch SDK docs and installable agent skills for any language             |

> **The exhaustive list is generated**

Every tool, with its full parameter list and error codes, is in the [MCP
reference](https://docs.shipeasy.ai/get-started/mcp-reference) — generated from the server's own catalog, so it can't
drift from what the server actually advertises. Don't learn tool names from prose; read that page.

### Prompts

Alongside tools, the server bundles a few long-form workflow playbooks, invoked in Claude Code as
`/mcp:shipeasy:<prompt>`. Ask your agent to list them (`ListPrompts`) rather than guessing names —
the set moves with the server version.

### Practical example

Open your agent in a project that already has the SDK wired and say:

> Use the Shipeasy MCP to put the new checkout behind a flag at 5%, and alert me if the checkout
> error rate goes above 2% over the next day.

The agent will:

**Check who it is**

Calls `mcp__shipeasy__whoami` to confirm the credential and which project it is bound to.

**Look before it creates**

Calls `mcp__shipeasy__release_flags_list` to check the flag doesn't already exist — the
list-before-create guard below can make this mandatory.

**Create and ramp the flag**

Calls `mcp__shipeasy__release_flags_create`, then `release_flags_update` to set the rollout
percentage.

**Define the metric it will watch**

Calls `mcp__shipeasy__metrics_create` with a query over the events your app already logs.

**Arm the alert**

Calls `mcp__shipeasy__ops_alerts_create` with the comparator, threshold and window. A firing
rule files its own item in the ops queue.

Nothing here needs a browser except the one-time login.

### Auth model (local server)

The `@shipeasy/mcp` server above runs **locally** — launched as a subprocess of your AI assistant over stdio. It reads `~/.shipeasy/credentials` on every tool call — the same file the CLI writes. There are three implications worth knowing:

1. **One login covers everything.** Run `shipeasy login` once on your machine, and every MCP tool in every assistant is authenticated.
2. **Refresh happens transparently.** If the access token has expired, the MCP server refreshes it before the tool call — same behaviour as the CLI.
3. **Tokens never appear in MCP config.** Your `mcp.json` only contains the launcher command. Stealing the config gives an attacker nothing.

### Hosted MCP server

We also run a **hosted, remote** MCP server on Cloudflare — no `npx`, no local subprocess, no credentials file. It speaks JSON-RPC over Streamable HTTP at:

```
https://slack.shipeasy.ai/mcp
```

This is the server behind Shipeasy in **Slack** — it powers Slack's built-in AI assistant ("MCP Server Connection") and the `@Shipeasy` bot. It exposes the flags / configs / kill-switch / metrics / ops tools, scoped to the Shipeasy project your Slack workspace is connected to.

> **It authenticates you by your Slack identity — there is no token to paste**

The hosted server is designed for an MCP client that can vouch for who you are (Slack does this).
You don't put a key in any config; the client injects your verified identity and the server
maps it to your Shipeasy account.

#### How auth works

Discovery is open; **acting** is gated. `initialize`, `ping`, and `tools/list` answer without auth so a client can connect and enumerate tools. Every `tools/call` runs through the full chain:

- `1 · Signed request`

- `2 · Workspace → project`

- `3 · You → member`

Every action then runs **as that verified member** against the admin API, which re-checks membership — so the service can only ever act as someone who is genuinely on the project.

#### Connecting to it

You don't configure this endpoint by hand. Add the Shipeasy app to your Slack workspace and connect the **Slack connector** in the dashboard; Slack then talks to `https://slack.shipeasy.ai/mcp` for you (Slack App → _MCP Server Connection_, auth type _Slack identity_). See the [Slack integration guide](https://docs.shipeasy.ai/feedback/devtools) for the workspace setup.

> **This endpoint is not a drop-in for Claude Code / Cursor**

The hosted server trusts Slack's injected identity, so a generic MCP client that can't
present a Slack-signed identity can reach discovery but every `tools/call` will fail the signature
gate. For coding assistants, use the local `@shipeasy/mcp` server above — it covers the full
~30-tool surface against your CLI login.

### Remote server for coding assistants (OAuth)

For Claude Code, Cursor, and claude.ai connectors we also run a **remote MCP server with OAuth 2.1** — no `npx`, no local subprocess, no credentials file. It exposes the full ~30-tool admin surface (not just the Slack `exp_*` subset) over Streamable HTTP at:

```
https://mcp.shipeasy.ai/mcp
```

Add it as an HTTP MCP server in your assistant's `mcp.json`:

```json title=".mcp.json"
{
  "mcpServers": {
    "shipeasy": {
      "type": "http",
      "url": "https://mcp.shipeasy.ai/mcp"
    }
  }
}
```

#### How auth works

When the assistant first calls a tool, the server answers with a `401` + `WWW-Authenticate` challenge and the client opens your browser. You sign in, pick the project to authorize, and approve with one click. From then on:

1. **You stay signed in.** The access token lasts 24 hours and is refreshed silently in the background via a 30-day refresh token — an actively-used machine effectively never re-logs in. You're only sent back through the browser after ~30 days of not using it, or if you revoke the grant.
2. **Re-auth is automatic.** When a token expires (or you revoke access), the very next tool call gets a fresh `401` challenge, so the client refreshes or re-runs the flow on its own — you don't run any command by hand.
3. **Membership is re-checked on every call.** The grant records _who_ you are; the admin API re-verifies your access to the target project on each request, so losing project access cuts you off immediately, regardless of token lifetime.

#### Targeting a specific project

The project you pick at consent time is the connection's default. To point a connection at a **specific project by UUID** — e.g. one `mcp.json` per repo, each bound to its own project — add an `X-Project-Id` header. No re-authorization is needed; the same login works across every project you're a member of:

```json title=".mcp.json"
{
  "mcpServers": {
    "shipeasy": {
      "type": "http",
      "url": "https://mcp.shipeasy.ai/mcp",
      "headers": {
        "X-Project-Id": "8f3c1e20-…-your-project-uuid"
      }
    }
  }
}
```

The header only selects _which_ project each call acts on — it is **not** a credential. The admin API still re-checks that your authenticated identity is a member of that project, so a header pointing at a project you can't reach is rejected.

#### List-before-create guard (optional)

A common agent failure is creating a duplicate flag or metric because it didn't check whether one already exists. The **list-before-create guard** forces the check: with it on, a `*_create` is refused unless it carries a fresh `listToken` that its sibling `*_list` just handed out (valid ~10 min). It's **off by default** on the hosted server; `shipeasy setup` writes it disabled and annotated so you can flip it on per connection:

```json title=".mcp.json"
{
  "mcpServers": {
    "shipeasy": {
      "type": "http",
      "url": "https://mcp.shipeasy.ai/mcp",
      "//list-guard": "Set X-Shipeasy-List-Guard to \"on\" to require a *_list before each *_create.",
      "headers": {
        "X-Project-Id": "8f3c1e20-…-your-project-uuid",
        "X-Shipeasy-List-Guard": "on"
      }
    }
  }
}
```

(`//list-guard` is a JSON-safe note key — strict JSON has no `//` comments — placed beside `headers`, never inside it, so it's never sent as an HTTP header.) The local `@shipeasy/mcp` stdio server has the same guard **on by default**, toggled instead via env (`SHIPEASY_MCP_LIST_GUARD=off`, window `SHIPEASY_MCP_LIST_GUARD_WINDOW_MINUTES`).

### Troubleshooting

> **Tool calls return `not authenticated`**

Run `shipeasy login` in a real terminal. The MCP server reads the same credentials file the CLI
writes. If the CLI sees you as logged in (`shipeasy whoami`) but the MCP server doesn't, your
assistant is launching with a stripped env — set `HOME` explicitly in your `mcp.json` block.

> **Tool calls return `project not detected`**

Pass an explicit `--project <id>` to `shipeasy login`, or set `SHIPEASY_PROJECT_ID=<id>` before launching your AI assistant. Some agents inherit env from the launcher, others don't.

> **Tool list is empty after install**

Restart the AI assistant. MCP servers are loaded at process start; editing `mcp.json` while the
assistant is running has no effect.

**Related**

- [MCP reference](https://docs.shipeasy.ai/get-started/mcp-reference) — Every tool, by group
- [Install in your agent](https://docs.shipeasy.ai/get-started/agents) — Claude Code, Cursor, Windsurf and the rest
- [Docs for agents](https://docs.shipeasy.ai/get-started/llms) — The docs as one file, for context
- [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) — How a tool call gets a project

---

## CLI

Source: https://docs.shipeasy.ai/get-started/cli

The `shipeasy` command — manage flags, configs, kill switches, metrics, the ops queue, keys, and the MCP server from your terminal or CI.

The CLI is a thin wrapper over the same Server Actions the dashboard uses. Anything you can do in the UI works from a terminal, and every read command supports `--json` so you can pipe results into scripts.

### Install

```bash
npm install -g @shipeasy/cli
```

```bash
shipeasy --version
shipeasy --help
```

See [Authenticate](https://docs.shipeasy.ai/get-started/authenticate) for the login flow.

### At a glance

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

### Global flags

The CLI doesn't have process-wide global options today — each
subcommand declares its own flags. Two flags are accepted by nearly
every write command, though:

- `--project <id>` (string) — Override the active project for this call. Wins over `SHIPEASY_PROJECT_ID` and the `.shipeasy` file in the cwd.
- `--json` (boolean) — On read commands, emit machine-readable JSON to stdout. On write commands, emit the created/updated resource as JSON instead of the human-readable confirmation line.

Env scoping is per-subcommand (e.g. `configs draft --env staging`)
rather than a global `--env` flag.

### Auth

| Command                          | Description                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `shipeasy login`     | PKCE browser flow. Saves credentials to `~/.shipeasy/credentials`.  |
| `shipeasy logout`    | Wipe credentials.                                                   |
| `shipeasy whoami`    | Show the active project, email, and accessible projects.            |
| `shipeasy bind <id>` | Bind the cwd to a project (writes `.shipeasy` in the project root). |

### Feature flags

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

### Killswitches (alias `ks`) — break-glass

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

### Dynamic values (configs)

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

### Metrics

| Command                                      | Description                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `shipeasy metrics list`          | Every metric registered for the project.                                                              |
| `shipeasy metrics show <id>`     | Show one metric by id, including its query DSL.                                                       |
| `shipeasy metrics create <name>` | Define a new metric. Required: `--event-name <name>` + one of `--query <dsl>` or `--query-ir <json>`. |
| `shipeasy metrics grammar`       | Print the metric DSL grammar — handy when authoring `--query`.                                        |
| `shipeasy metrics archive <id>`  | Soft-delete a metric.                                                                                 |

### SDK keys

| Command                                           | Description                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| `shipeasy sdk keys list`              | List keys (id, kind, last used). The raw token is **never** shown after creation. |
| `shipeasy sdk keys create --type <server | client                                                                            | admin>` | Create a key (required: `--type`). Token is shown **once**. |
| `shipeasy sdk keys revoke <id>`       | Revoke by id or id-prefix. First match wins.                                      |

### API tokens

For long-lived CI access, create an **admin** SDK key from the dashboard's
**SDK Keys** page (`shipeasy sdk keys create --type admin`) and pass it
via the `SHIPEASY_CLI_TOKEN` env. See
[Authenticate → SDK keys vs API tokens](https://docs.shipeasy.ai/get-started/authenticate#sdk-keys-vs-api-tokens--pick-the-right-one)
for when to use each.

### Feedback (bugs & requests)

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

### MCP server

| Command                              | Description                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `shipeasy mcp install`   | Patch the right config file for Claude Code, Cursor, Windsurf, or a custom MCP client.     |
| `shipeasy mcp status`    | Show the current MCP registration state for the detected client.                           |
| `shipeasy mcp uninstall` | Remove the registration.                                                                   |
| `shipeasy mcp status`    | Run the MCP server in the foreground. Used by the install command — rarely needed by hand. |

See [MCP server](https://docs.shipeasy.ai/get-started/mcp) for the tool inventory.

### Agent skills & plugins

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

### Environment variables

- `SHIPEASY_CLI_TOKEN` (string) — Long-lived admin token used in CI. Bypasses interactive `shipeasy login`.
- `SHIPEASY_API_BASE_URL` (string) — Override the admin API base URL (default `https://shipeasy.ai`).
- `SHIPEASY_APP_BASE_URL` (string) — Override the Shipeasy dashboard base URL the CLI links to from its device-auth output (default `https://shipeasy.ai`).
- `SHIPEASY_PROJECT_ID` (string) — Default project id when no `--project` flag is passed.
- `NO_COLOR` (any) — Disable ANSI colour output.

### Exit codes

`0` on success, `1` on any error. JSON output goes to stdout; human-readable progress goes to stderr — pipes work the way you'd expect.

```bash
shipeasy release flags list | jq '.[] | select(.enabled == true) | .name'
```

### Examples

```bash
## Create a feature flag, set targeting, roll out to 5%, then promote to 100%.
shipeasy release flags create checkout-v2 --rules '[{"attr":"plan","op":"eq","value":"pro"}]'
shipeasy release flags update checkout-v2 --rollout-percent 5
shipeasy release flags update checkout-v2 --rollout-percent 100

## File a bug from CI when a smoke test fails.
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

---

## Quickstart (flags/gates)

Source: https://docs.shipeasy.ai/flags/gates/quickstart

Create a feature flag, wrap your code, ramp from 0% to 100% — end to end in five minutes.

This walks you through shipping a real feature behind a feature flag. You'll create the feature flag, wrap a code
path, and ramp it from 0% → 5% → 25% → 100%. By the end the feature is live for everyone, with no
redeploys between ramp steps.

**Install the SDK & log in**

```bash
npm install @shipeasy/sdk && npx shipeasy login
```

**Create a feature flag at 0%**

```bash
shipeasy release flags create checkout-v2 --rollout-percent 0
```

**Put the new code path behind a feature flag**

```bash
const flags = new Client(currentUser);
if (flags.getFlag('checkout-v2')) { ... }
```

**Bump to 5%, then 25%, then 100%**

```bash
shipeasy release flags update checkout-v2 --rollout-percent 100
```

### Prerequisites

- A Shipeasy project. Starting one costs nothing.
- A **server SDK key** for the environment you're deploying to:

```bash
shipeasy sdk keys create --type server
```

- The SDK in your project:

```bash
npm install @shipeasy/sdk
```

### 1. Initialise once at boot

The SDK loads the flag bundle into memory and refreshes it in the background. No fetch on the hot
path, no per-request latency. Configure once, use everywhere.

```ts title="src/lib/shipeasy.ts"
import { configure } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan }),
});
```

Call this once during boot (server entry, root layout, or worker startup). The same `configure()`
call covers flags, configs, and killswitches — you do not need separate init for each.
The optional `attributes` transform maps your user object onto the Shipeasy attribute map so that
every bound `Client` you construct evaluates against the right context.

### 2. Create the feature flag

```bash
shipeasy release flags create checkout-v2 --rollout-percent 0
```

`--rollout-percent 0` means "no one sees it yet." The feature flag exists, the SDK
knows about it, but every call returns `false`. Safe to deploy. (A
description field exists on the feature flag row but the CLI's `flags create`
doesn't accept a `--description` flag today — add the description from
the dashboard after creating.)

Alternatively, create it in the dashboard: **Flags → New feature flag → Save**.

### 3. Wrap the code path

**TypeScript**

```ts title="app/checkout/page.tsx"
import { Client } from "@shipeasy/sdk/server";

export default async function CheckoutPage() {
  const flags = new Client(await getCurrentUser());

  if (flags.getFlag("checkout-v2")) {
    return <CheckoutV2 />;
  }
  return <CheckoutV1 />;
}
```

**Python**

```python
flags = shipeasy.Client(current_user)
if flags.get_flag("checkout-v2"):
    return checkout_v2()
return checkout_v1()
```

**Go**

```go
flags := shipeasy.NewClient(currentUser)
if flags.GetFlag("checkout-v2") {
    return checkoutV2()
}
return checkoutV1()
```

**Ruby**

```ruby
flags = Shipeasy::Client.new(current_user)
if flags.get_flag("checkout-v2")
  render CheckoutV2
else
  render CheckoutV1
end
```

**Java**

```java
Client flags = new Client(currentUser);
if (flags.getFlag("checkout-v2")) {
    return checkoutV2();
}
return checkoutV1();
```

**Kotlin**

```kotlin
val flags = Client(currentUser)
if (flags.getFlag("checkout-v2")) {
    checkoutV2()
} else {
    checkoutV1()
}
```

**PHP**

```php
$flags = new Shipeasy\Client($currentUser);
if ($flags->getFlag('checkout-v2')) {
    return checkoutV2();
}
return checkoutV1();
```

**Swift**

```swift
let flags = try Client(currentUser)
if await flags.getFlag("checkout-v2") {
    return checkoutV2()
}
return checkoutV1()
```

Two things to note:

- **Bind the client to your user once.** The `attributes` transform you passed to `configure()` resolves a stable `user_id` — the bucketing key. Same user, same answer, every request.
- **The call is synchronous.** `flags.getFlag()` does a hash-table lookup against the in-memory bundle — no network round-trip per read. (In Swift the getters are `async` because the engine is an actor.)

Deploy this. With `--rollout-percent 0`, every user sees `CheckoutV1`. The new path is shipped but dark.

### 4. Ramp gradually

When you're ready to start exposing real users:

```bash
## Day 1 — 5% of all users
shipeasy release flags update checkout-v2 --rollout-percent 5

## Day 3 — 25%, after metrics look fine
shipeasy release flags update checkout-v2 --rollout-percent 25

## Day 5 — full launch
shipeasy release flags update checkout-v2 --rollout-percent 100
```

Each ramp step propagates to every SDK in under a second. No redeploy, no env var change.

The same feature flag can be ramped from the dashboard with a slider, or via the
[Admin API](https://docs.shipeasy.ai/api). Resolve the feature flag's id, then PATCH:

```bash
## Resolve `checkout-v2` → its UUID
GATE_ID=$(curl -sS \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  "https://shipeasy.ai/api/admin/gates?name=checkout-v2" | jq -r '.data[0].id')

curl -X PATCH "https://shipeasy.ai/api/admin/gates/$GATE_ID" \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPct": 2500}'   # rolloutPct is basis points: 2500 = 25%
```

### 5. Kill it if something goes wrong

If the new path breaks at 25%, flip the killswitch:

```bash
shipeasy release flags disable checkout-v2
```

Every SDK serves `false` within its next poll — the interval is
plan-derived, not something you set. Targeting rules and the rollout percentage are preserved on
the feature flag — when you fix the bug, `shipeasy release flags enable checkout-v2`
restores the previous state exactly.

For incident-grade flips that propagate faster and are a dedicated
control surface, use a [killswitch](https://docs.shipeasy.ai/flags/killswitches)
instead.

### Where to next

- **[Add targeting rules](https://docs.shipeasy.ai/flags/gates/targeting)** — Restrict eligibility — by country, plan tier, account attribute, or any field you pass in `ctx`.

- **[Understand rollouts](https://docs.shipeasy.ai/flags/gates/rollouts)** — Sticky bucketing, deterministic hashing, multi-arm rollouts, salt — how the percentage actually works.

- **[QA + dogfood overrides](https://docs.shipeasy.ai/flags/gates/overrides)** — Force a feature flag on or off for specific user IDs without touching targeting or rollout.

- **[Real scenarios](https://docs.shipeasy.ai/flags/case-studies)** — Worked examples — checkout rollout, beta allow-list, regional rollout.

**Related**

- [Rollouts & bucketing](https://docs.shipeasy.ai/flags/gates/rollouts) — What the percentage actually does
- [Targeting rules](https://docs.shipeasy.ai/flags/gates/targeting) — Who is eligible in the first place
- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — Which key reads which environment
- [Edge cases](https://docs.shipeasy.ai/flags/edge-cases) — Sticky bucketing, propagation, SSR flicker

---

## Quickstart (flags/configs)

Source: https://docs.shipeasy.ai/flags/configs/quickstart

Create a typed config, read it with getConfig, change the value in production — no redeploy, five minutes end to end.

This walks you through replacing one hard-coded constant with a config you can change from a
dashboard. You'll create the config with a schema, read it in code with a guaranteed fallback, then
change the value in production and watch it land without a deploy.

**Install the SDK & log in**

```bash
npm install @shipeasy/sdk && npx shipeasy login
```

**Create the config with its shape and first value**

```bash
shipeasy release configs create uploads.limits --schema '{"type":"object","properties":{"max_files":{"type":"number"}}}' --value '{"max_files":5}'
```

**Read it where the constant used to be**

```bash
const cfg = new Client(currentUser)
  .getConfig('uploads.limits', { defaultValue: { max_files: 5 } });
```

**Raise the limit in production**

```bash
shipeasy release configs update uploads.limits --prod '{"max_files":20}'
```

### Prerequisites

- A Shipeasy project. Starting one costs nothing.
- A **server SDK key** for the environment you're deploying to:

```bash
shipeasy sdk keys create --type server
```

- The SDK in your project:

```bash
npm install @shipeasy/sdk
```

### 1. Initialise once at boot

Same one call every Shipeasy product runs on — configs ride the bundle the SDK already keeps in
memory, so a config read costs no network.

```ts title="src/lib/shipeasy.ts"
import { configure } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY!,
  attributes: (user: AppUser) => ({ user_id: user.id, plan: user.plan }),
});
```

> **One configure call, one key**

The server key goes on the server and the client key in the browser — never the other way round,
and never both. See [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments)

### 2. Create the config

A config is a **JSON object** with a schema. The schema is not decoration: every value published
afterwards is validated against it, so a typo in a dashboard field is refused at the edit rather
than discovered by your parser at 3am.

```bash
shipeasy release configs create uploads.limits \
  --description "Per-plan upload ceilings" \
  --schema '{"type":"object","properties":{"max_files":{"type":"number"},"max_mb":{"type":"number"}},"required":["max_files"]}' \
  --value '{"max_files":5,"max_mb":25}'
```

Two things about the name. It is `folder.name` — two lowercase segments — and it is **immutable
after create**, because it is the key your code looks the value up by. Pick it as carefully as you
would a database column.

Without `--value` the config starts as `{}` on every environment, which your default will have to
cover. Seeding one environment at a time works too — `--dev`, `--staging`, `--prod` each publish to
just that one.

Or in the dashboard: **Configs → Dynamic values → New**

### 3. Read it where the constant used to be

```ts title="src/upload/limits.ts"
import { Client } from "@shipeasy/sdk/server";

interface UploadLimits {
  max_files: number;
  max_mb?: number;
}

export function limitsFor(user: AppUser): UploadLimits {
  return new Client(user).getConfig<UploadLimits>("uploads.limits", {
    defaultValue: { max_files: 5 },
  });
}
```

`getConfig` is **synchronous** — the bundle is already in memory, so this is a hash-table lookup, not
a fetch. The same call works in the browser build from `@shipeasy/sdk/client`.

> **Always pass a defaultValue**

Without one, `getConfig` returns `undefined` whenever the key is absent or the SDK has not
finished its first load — and a config read that can be `undefined` on a cold boot is a crash
waiting for your next deploy. The default is what your code did before you made the value dynamic,
so you already know it

Validating as you read costs one line, and turns a malformed value into a fallback instead of an
exception downstream:

```ts
new Client(user).getConfig("uploads.limits", {
  decode: (raw) => UploadLimitsSchema.parse(raw),
  defaultValue: { max_files: 5 },
});
```

If `decode` throws, the SDK warns and hands back the default.

### 4. Change the value

```bash
shipeasy release configs update uploads.limits --prod '{"max_files":20,"max_mb":100}'
```

`--prod` publishes to production only, immediately. Pass `--value` instead to publish the same value
to every environment at once.

The new value is in KV in under 100 ms; your running processes pick it up on their next background
poll, with no redeploy and no restart. Nothing in step 3 changes.

If you need to act the moment a value moves — drop a cache, rebuild a derived object — subscribe
with [`onChange`](https://docs.shipeasy.ai/sdks/onchange) rather than polling it yourself.

### What just happened

You moved one number out of your source and into something you can change from a phone. The read
path did not get slower: the value rides the same in-memory bundle your flags do, refreshed in the
background, so `getConfig` stays a lookup.

What you have now that a constant could not give you: a schema that refuses malformed edits, a
version history per environment, and a fallback that keeps the code running when the value is
missing.

### Where to next

- **[Dynamic values](https://docs.shipeasy.ai/flags/configs/values)** — Types, structured configs, size limits, and how a value is versioned per environment.

- **[Targeting & rollouts](https://docs.shipeasy.ai/flags/configs/targeting)** — Vary a value by user, or ramp a new one the way you would ramp a feature flag.

- **[Config, flag, or killswitch?](https://docs.shipeasy.ai/flags/decision)** — Three primitives, one question — which one fits the change you are shipping.

**Related**

- [Dynamic values](https://docs.shipeasy.ai/flags/configs/values) — Types and structured configs
- [Reacting to changes](https://docs.shipeasy.ai/sdks/onchange) — Act the moment a value moves
- [Plan entitlements with a config](https://docs.shipeasy.ai/flags/case-studies/entitlements-with-configs) — One config instead of a flag sprawl
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — When a new value reaches your process

---

## Quickstart (flags/killswitches)

Source: https://docs.shipeasy.ai/flags/killswitches/quickstart

Wire a killswitch around a risky subsystem in five minutes — so the 3am on-call has one switch to flip.

A killswitch is the lever you pull when something is on fire. This walkthrough takes you from zero
to a wired-in killswitch around an outbound-email path. By the end, on-call can disable email
sending in under five seconds without touching code.

**Create the killswitch (default OFF)**

```bash
shipeasy release killswitch create transactional.emails-enabled --value false
```

**Guard the dangerous path**

```bash
if (flags.ks('transactional.emails-enabled')) return; // killed → bail
```

**Flip it, watch it stop**

```bash
shipeasy release killswitch update transactional.emails-enabled --value true
```

**Subscribe a connector (Slack / GitHub / etc.)**

```bash
Add via Dashboard → Feedback → Connectors → killswitch.flipped
```

### 1. Create the killswitch

```bash
shipeasy release killswitch create transactional.emails-enabled \
  --description "Disables outbound transactional email" \
  --value false
```

Killswitch names must be `folder.name`. `--value false` means "killed = false" by
default — the call to `flags.ks(...)` returns `false`, your code reads "not
killed, proceed". Flip it to `true` to kill the path in production. Until the
SDK has fetched the first blob, reads return `false` (the safer default for
"is this killed?") — so a cold cache won't accidentally kill your emails.

### 2. Wire it into the code path

Wrap the dangerous call with the killswitch read — it returns `true` when the
killswitch is flipped, `false` (or the SDK default) otherwise:

**TypeScript**

```ts title="src/lib/mailer.ts"
import { flags } from "@shipeasy/sdk/server";

export async function sendOrderEmail(order: Order) {
  if (flags.ks("transactional.emails-enabled")) {
    logger.warn("emails paused via killswitch", { orderId: order.id });
    return;
  }

  await mailer.send(order);
}
```

**Python**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Python](https://docs.shipeasy.ai/sdks/python) for the full client API.

**Go**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Go](https://docs.shipeasy.ai/sdks/go) for the full client API.

**Ruby**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Ruby](https://docs.shipeasy.ai/sdks/ruby) for the full client API.

**Java**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Java](https://docs.shipeasy.ai/sdks/java) for the full client API.

**Kotlin**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Kotlin](https://docs.shipeasy.ai/sdks/kotlin) for the full client API.

**PHP**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [PHP](https://docs.shipeasy.ai/sdks/php) for the full client API.

**Swift**

Killswitches ride the same blob as flags. Read them from the evaluate result; see [Swift](https://docs.shipeasy.ai/sdks/swift) for the full client API.

Three things to internalise:

- **`undefined` for `ctx`.** Killswitches don't target — they're global. The second arg is just there to keep the function signature aligned with `gate()`.
- **`defaultValue: true` is load-bearing.** Don't omit it. If KV is unreachable during the very incident that prompted the kill, you do not want the killswitch to silently default to `false` and amplify the outage.
- **Log the bypass.** When the killswitch is engaged, log a structured warn so post-mortem can reconstruct what was suppressed.

Deploy this. Killswitch is `on`, fallback is `true`, behaviour is unchanged from before.

### 3. Rehearse the flip

The most common reason a killswitch fails to help during an incident is that no one has ever
flipped it before. Rehearse in staging:

```bash
## Flip the killswitch to true ("kill the path") — single-value form
shipeasy release killswitch update transactional.emails-enabled --value true

## Confirm via the SDK eval endpoint
curl "https://api.shipeasy.ai/sdk/evaluate" \
  -H "Authorization: Bearer $SHIPEASY_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "user": { "user_id": "drill-user" } }' \
  | jq '.killswitches["transactional.emails-enabled"]'
## → true

## Verify no emails flow in staging
## … run your normal email test path …

## Re-enable (flip back to false = "not killed")
shipeasy release killswitch update transactional.emails-enabled --value false
```

Time how long it takes from "decide to flip" to "next email is suppressed."
The next call should return the new value within one poll interval of the
flip — that interval is plan-derived and advertised to the SDK, not configured.

### 4. Get notified when the killswitch flips

A killswitch is a _social_ signal as much as a technical one. Flipping it
should announce itself on the team's incident channel and create a paper
trail.

Today this is wired through the **Feedback → Connectors** surface in the
dashboard. Pick `killswitch.flipped` as the event, point it at a Slack or
GitHub connector, and configure the filter (e.g. only fire for prod, or
only for specific killswitch names). The connector payload includes who
flipped it, when, and the new value — wire it into your incident channel
and your runbook ("if you see this, page primary on-call within 2 minutes").

For production-grade pages, point the connector at PagerDuty or Opsgenie —
that way flipping the killswitch _is_ declaring the incident, which is
usually the right move.

### What you have now

- A killswitch in the dashboard at **Killswitches → emails-enabled**.
- A wrapped code path that respects it on every call.
- A rehearsed flip-and-restore drill that took < 5 seconds.
- An alert on the flip event so the team knows when production is in degraded mode.

That's the whole pattern. Repeat for every system whose pause-button you'd want on the lock screen
of your phone.

### Where to next

- **[When to add a killswitch](https://docs.shipeasy.ai/flags/killswitches/patterns)** — Which subsystems deserve one — and which should stay feature flags.

- **[Feature flags vs killswitches](https://docs.shipeasy.ai/flags/gates)** — Same primitive at the wire level, different ergonomics. When to reach for which.

- **[Worked example: paused emails](https://docs.shipeasy.ai/flags/case-studies#kill-emails)** — The walkthrough from the case-studies page, with more context on the incident.

**Related**

- [Patterns](https://docs.shipeasy.ai/flags/killswitches/patterns) — What belongs behind one, and what does not
- [Maintenance mode](https://docs.shipeasy.ai/flags/case-studies/maintenance-mode) — The worked incident
- [Which primitive?](https://docs.shipeasy.ai/flags/decision) — Killswitch vs flag vs config
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — How fast a flip actually lands

---

## Quickstart (metrics)

Source: https://docs.shipeasy.ai/metrics/quickstart

Create your first metric, log the events it depends on, and put an alert on it — five minutes, end to end.

This walks you through the metric pipeline end to end: pick what to measure, log the underlying
events, create the metric definition, and put a threshold alert on it. By the end you'll have a
number you can watch while you ramp, and a rule that pages when it moves the wrong way.

**Create a conversion metric**

```bash
shipeasy metrics create purchase_conversion --event-name purchase --query 'count(purchase) / count(session_start)'
```

**Log the underlying event from your code**

```bash
flags.track(userId, 'purchase', { revenueCents })
```

**Raise a ticket when it drops**

```bash
shipeasy ops alerts create --name 'Conversion dropped' --metric-id <id> --comparator lt --threshold 0.03 --window-hours 24
```

**Watch the series on the dashboard**

```bash
shipeasy metrics series purchase_conversion
```

### 1. Pick what to measure

Before you create anything, answer one question: **what number tells you the change worked?**

For a checkout-flow rewrite: probably `purchase_conversion` — did exposed users buy? For a new
paywall: probably `subscription_conversion` — did they sign up? For a homepage redesign:
typically `session_engagement` — did they click past the fold?

Pick one. Two is fine if they're closely related. Five means you haven't decided yet — go back and
decide.

The metric needs to be:

- **Computable from events you already log** (or are willing to start logging).
- **Specific to the change** — not "DAU," which moves for a hundred reasons.
- **Reasonable to see** — on 1,000 users a day, a 1% move is inside the daily noise. Run `shipeasy metrics series <name>` first and look at how much the number already wanders before you decide what counts as a real move.

### 2. Define the metric

The simplest case — how often did event X happen, out of the chances it had?

```bash
shipeasy metrics create purchase_conversion \
  --event-name purchase \
  --query 'count(purchase) / count(session_start)'
```

On a chart that is the conversion rate. In an experiment it collapses per user
to a `0` or a `1` — did they purchase, among the users who started a session.

You now have a metric definition. It does nothing on its own; it tells the analysis pipeline how
to aggregate the underlying events per user.

For a revenue metric (sum the `revenueCents` property across `purchase` events per user):

```bash
shipeasy metrics create revenue_per_user \
  --event-name purchase \
  --query 'sum(purchase, revenueCents)'
```

For more aggregation types, see [Aggregations](https://docs.shipeasy.ai/metrics/aggregations).

### 3. Log the underlying events

The metric is a _rule_ for aggregating events. The events themselves come from your code:

```ts title="app/checkout/success/page.tsx"
import { flags } from "@shipeasy/sdk/server";

export default async function CheckoutSuccess({ order }: { order: Order }) {
  flags.track(order.userId, "purchase", {
    revenueCents: order.totalCents,
    currency: order.currency,
    channel: order.acquisitionChannel,
  });
  return <ThankYou />;
}
```

A few rules that matter:

- **The first argument is the `userId`.** `flags.track` requires it as a positional arg — it is what lets the analysis pipeline collapse events to one value PER USER.
- **Properties become filterable.** You can later add a metric like "organic-channel purchases" by filtering on `channel` inside the DSL selector (`count(purchase{channel="organic"})`).
- **`track()` is fire-and-forget.** It returns void; the event flushes asynchronously. Don't `await` it expecting a delivery guarantee — it's analytics, not transactional state.

Deploy this. Events start flowing. The metric definition will pick them up on the next analysis
window (daily by default).

### 4. Put an alert on it

A metric you have to remember to look at is a metric nobody looks at. Give it a threshold and let
it page:

```bash
## `--metric-id` takes the metric's id — `shipeasy metrics list` prints it
## next to the name.
shipeasy ops alerts create \
  --name 'Conversion dropped' \
  --metric-id <id> \
  --comparator lt --threshold 0.03 \
  --window-hours 24 --bucket-minutes 60
```

Add a second metric for the thing you must not break while you ramp:

```bash
shipeasy metrics create p95_page_load_ms \
  --event-name page_view \
  --query 'p95(page_view, loadTimeMs)'

shipeasy ops alerts create \
  --name 'Page load too slow' \
  --metric-id <id> \
  --comparator gt --threshold 1200 --window-hours 1
```

A firing rule opens an item in the ops queue with the series attached, so the regression arrives as
a ticket rather than as a message somebody has to notice. Full options — anomaly rules, sustained
departure, required buckets — are in [Alerts](https://docs.shipeasy.ai/metrics/alerts).

### 5. Read the series

`shipeasy metrics series purchase_conversion` prints the same buckets the dashboard charts and the
alert evaluator reads, so what you see locally is what the rule is judging:

```
2026-08-06  4.8%
2026-08-07  5.2%
2026-08-08  5.1%
```

If the number is flat or missing, two checks:

1. **Are events actually landing?** Open the **Events** tab and confirm non-trivial counts. Zero
   means your `track()` call isn't running on the path you think it is.
2. **Is the window long enough?** A 1-hour window on a low-volume event is mostly empty buckets.
   Widen the window, or set `--required-buckets` so one lone sample can't page anyone.

### Where to next

- **[Aggregation types](https://docs.shipeasy.ai/metrics/aggregations)** — Conversion, count, sum, mean, ratio — what each does and when to pick it.

- **[The metric DSL](https://docs.shipeasy.ai/metrics/grammar)** — The full grammar — every aggregation, filter and operator, and what the parser refuses.

- **[Threshold alerts](https://docs.shipeasy.ai/metrics/alerts)** — Windows, buckets, anomaly rules, and the ticket a firing rule files for you.

**Related**

- [Aggregation types](https://docs.shipeasy.ai/metrics/aggregations) — Conversion, count, sum, mean, ratio
- [Query DSL grammar](https://docs.shipeasy.ai/metrics/grammar) — Everything the query language allows
- [Configure alerts](https://docs.shipeasy.ai/metrics/alerts) — Raise a threshold on what you just built
- [Flow & dependencies](https://docs.shipeasy.ai/flags/flow) — Trace what feeds what

---

## Getting started (feedback)

Source: https://docs.shipeasy.ai/feedback/getting-started

Wire a "Report bug" button into your app in two minutes.

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

### Where to next

- **[Case studies](https://docs.shipeasy.ai/feedback/case-studies)** — "Forward bugs to Slack", "Wire votes to a public roadmap", "Auto-attach session replay".

- **[API reference](https://docs.shipeasy.ai/feedback/api)** — `POST /api/admin/bugs`, `POST /api/admin/feature-requests`, listing, status updates.

- **[CLI commands](https://docs.shipeasy.ai/get-started/cli)** — Every `shipeasy feedback …` verb.

**Related**

- [The devtools overlay](https://docs.shipeasy.ai/feedback/devtools) — Filing without leaving the app
- [Connectors](https://docs.shipeasy.ai/feedback/connectors) — Mirror reports into GitHub, Sheets or Slack
- [Edge cases](https://docs.shipeasy.ai/feedback/edge-cases) — Spam, dedup, PII, anonymous users
- [Feedback API](https://docs.shipeasy.ai/feedback/api) — The REST endpoints underneath

---

## Scheduled triggers

Source: https://docs.shipeasy.ai/get-started/triggers

Provision a scheduled agent that runs ops:work --pr on a cadence, burning down the feedback queue one PR at a time — on Claude Code, Cursor, Copilot and more.

A **trigger** is an _unattended, scheduled_ agent run. On a cron cadence it runs **`/shipeasy:ops:work --pr`** against your project — burning down the feedback queue (bugs, feature requests, auto-filed error/alert tickets) one item at a time, committing each fix on its own branch, and opening **one PR per item** for review. No human in the loop.

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

### Three scheduler tiers

| Tier                              | Platforms                              | Mechanism                                                                          |
| --------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| **A — Shipeasy fires it**         | `claude`, `cursor`, `copilot`, `jules` | Shipeasy's own cron starts the run over HTTPS — your machine can be off            |
| **B — scheduled on the platform** | `codex`                                | the vendor's own scheduler or an Actions workflow starts it                        |
| **C — headless + external cron**  | `gemini` (and `codex`)                 | non-interactive run mode driven by system cron or a GitHub Actions `schedule:` job |

| `--platform` | Scheduler                                                                       | Launch / auth                                            |
| ------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `claude`     | `/schedule` cloud routine                                                       | runs `ops:work --pr`; **registers a Shipeasy connector** |
| `cursor`     | Shipeasy cron → `POST https://api.cursor.com/v1/agents`                         | `autoCreatePR`; `CURSOR_API_KEY`                         |
| `copilot`    | Shipeasy cron → GitHub coding-agent task via `.github/agents/shipeasy.agent.md` | **Connect GitHub** (user-to-server token); PAT fallback  |
| `jules`      | Shipeasy cron → Jules session                                                   | Jules API key                                            |
| `codex`      | Codex Automations (local cron) or an Actions `schedule:` job                    | `codex exec --sandbox danger-full-access`                |
| `gemini`     | Actions `schedule:` (run-gemini-cli)                                            | `gemini -p --approval-mode=yolo`                         |

### The run is identical everywhere

Whatever the provider, the scheduled run authenticates with a restricted **`ops`** key, refreshes the plugin + CLI, and follows the installed `ops:work --pr` workflow. Mint the key with:

```bash
npx -y @shipeasy/cli@latest keys create --type ops
```

The `ops` key can read the queue, flip item status, link the PR it opens, and create resources — but never edits or deletes existing ones, and auto-extends its 7-day expiry on each run. A leaked trigger prompt can't compromise the project. **Never embed your admin login token.**

### Tier C — the GitHub Actions shape

For headless providers with no native scheduler, a scheduled Actions workflow is the always-on driver (Gemini shown via the official [`run-gemini-cli`](https://github.com/google-github-actions/run-gemini-cli) Action — swap the run step for `codex exec` for Codex):

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

### Connector registration — Shipeasy-fired vs. platform-scheduled

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

---

## Troubleshooting

Source: https://docs.shipeasy.ai/get-started/troubleshooting

Common errors you may hit wiring up Shipeasy — what they mean and how to resolve them.

A running list of the errors customers actually hit, what each one means, and the
fix. If you run into something that isn't here, file it from the in-app feedback
widget and we'll add it.

### "Request Origin is not in the project's allowed list" (403)

A browser request made with a **client key** was rejected because its `Origin`
didn't match the project's configured domain. Client keys are public (they ship
in your bundle), so the Worker only honours them when the request comes from a
domain you've explicitly allowlisted — this is what stops a leaked client key
being used from someone else's site.

#### Why you can hit this even after setting the domain

The origin allowlist is **snapshotted onto each key when the key is minted**, not
read live from your project settings on every request. So if you mint a client
key first and _then_ change the domain (or fix a typo, or switch to a wildcard),
existing keys keep the value they had at mint time and keep getting 403s — even
though the dashboard shows the new domain.

> **Fixed automatically on domain change**

Updating a project's domain in **Settings → Domain** now re-stamps the new value onto every
existing (non-revoked) key. If you're on an older deploy, or want an immediate unblock, use one of
the fixes below.

#### How to resolve

**Confirm the domain in Settings → Domain.** Use the bare host, no scheme and no path —
`app.example.com`, not `https://app.example.com/`.

**Re-save the domain** (even to the same value). This re-stamps the allowlist onto every
existing key.

**Or re-mint the client key.** A freshly minted key snapshots the current domain, so swapping in
a new key is the fastest one-off unblock.

#### Domain matching rules

| Configured value | Matches                                                        | Does **not** match |
| ---------------- | -------------------------------------------------------------- | ------------------ |
| `example.com`    | `example.com`, `www.example.com`                               | `app.example.com`  |
| `*.example.com`  | `example.com` (apex), `app.example.com`, `any.sub.example.com` | `notexample.com`   |
| `*`              | any origin                                                     | —                  |
| _(empty)_        | any origin (no restriction)                                    | —                  |

> **Wildcards cover the apex too**

`*.example.com` matches both subdomains **and** the bare apex `example.com`, so you don't need a
second entry for the root domain. Note that `localhost` and loopback origins are always allowed,
and server-side / SSR calls (which send no `Origin` header) are never blocked by this check.

### "Invalid or revoked SDK key" (401)

The key in your `X-SDK-Key` / `Authorization` header isn't recognised. Usual
causes:

- **Wrong side.** A server key sent from the browser, or a client key used for a server-only read. Each entrypoint takes exactly one, separately-named key — see [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments).
- **Revoked or expired.** Check the key list in **Settings → Keys**; mint a replacement if it's gone.
- **Wrong project.** The key belongs to a different project than the resources you're querying.

### Flags read `false` / configs read their default on the server during SSR

If a `100%` rollout still evaluates to `false` during server rendering, the
request probably reached the SDK without a stable unit id, so it was bucketed as
anonymous and denied before the rollout check. Make sure an identity is passed
(or rely on the anonymous-id cookie minted on HTML routes). See
[Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing).

### Changes don't show up after publishing

KV blobs are served from cache with an explicit purge on write, so a stale read
is almost always a caching layer in front of you — not a lost write. Check, in
order: your browser's cache (hard-reload), then your zone's Browser Cache TTL,
then re-publish. Remember the SDK also polls on your plan's interval — a fresh
read can be up to that old. See [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching).

**Related**

- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — The cause of most wrong-value reads
- [Evaluation & caching](https://docs.shipeasy.ai/get-started/evaluation-and-caching) — Why a change has not landed yet
- [Evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) — Ask the SDK why it answered that
- [Edge cases](https://docs.shipeasy.ai/flags/edge-cases) — The ones that bite exactly once

---

# Reference

## Every CLI command

Full flags and arguments: https://docs.shipeasy.ai/get-started/cli-reference

- `shipeasy bind` — --name
- `shipeasy detect` — --json
- `shipeasy docs`
- `shipeasy docs get` — --framework --name --sdk
- `shipeasy docs list` — --sdk
- `shipeasy docs skill` — --agent --dir --global --install --sdk
- `shipeasy install` — --json --no-skills --profile --project
- `shipeasy login` — --force --project
- `shipeasy logout` — --force
- `shipeasy mcp`
- `shipeasy mcp install` — --client --dry-run --force --scope
- `shipeasy mcp status`
- `shipeasy mcp uninstall` — --client --scope
- `shipeasy metrics`
- `shipeasy metrics archive` — --data
- `shipeasy metrics create` — --default-min-effect-of-interest --direction --display --display-name --event-name --folder --query --query-ir --unit --winsorize-pct
- `shipeasy metrics events`
- `shipeasy metrics events approve` — --description --folder --properties
- `shipeasy metrics events archive` — --data
- `shipeasy metrics events create` — --description --folder --properties
- `shipeasy metrics events get` — --data
- `shipeasy metrics events list` — --data --q
- `shipeasy metrics events update` — --description --folder --properties
- `shipeasy metrics grammar`
- `shipeasy metrics list` — --data --q
- `shipeasy metrics series` — --bucket --from --to
- `shipeasy metrics show` — --data
- `shipeasy metrics unarchive` — --data
- `shipeasy metrics update` — --default-min-effect-of-interest --direction --display --display-name --event-name --folder --query --query-ir --unit --winsorize-pct
- `shipeasy ops`
- `shipeasy ops ack` — --agent --session-id
- `shipeasy ops agents`
- `shipeasy ops agents list` — --data
- `shipeasy ops alerts`
- `shipeasy ops alerts archive` — --data
- `shipeasy ops alerts channels` — --data
- `shipeasy ops alerts create` — --auto-resolve-minutes --bucket-minutes --comparator --composite --delay-minutes --direction --enabled --group-alerts --kind --max-groups --metric-id --name --no-data-minutes --notify --range-max --range-min --recovery-threshold --required-buckets --severity --sigma --sustained --threshold --warn-threshold --window-hours
- `shipeasy ops alerts list` — --data --q
- `shipeasy ops alerts update` — --auto-resolve-minutes --bucket-minutes --comparator --composite --delay-minutes --direction --enabled --group-alerts --kind --max-groups --name --no-data-minutes --notify --range-max --range-min --recovery-threshold --required-buckets --severity --sigma --sustained --threshold --warn-threshold --window-hours
- `shipeasy ops bug` — --actual-result --assignee-id --context --expected-result --notify --page-url --priority --reporter-email --status --steps-to-reproduce --subscribers --tags --user-agent --viewport
- `shipeasy ops comments`
- `shipeasy ops comments create` — --body --parent-id
- `shipeasy ops comments list` — --data
- `shipeasy ops create` — --actual-result --assignee-id --context --description --expected-result --notify --page-url --priority --reporter-email --status --steps-to-reproduce --subscribers --tags --type --use-case --user-agent --viewport
- `shipeasy ops feature` — --assignee-id --context --description --notify --page-url --priority --reporter-email --status --subscribers --tags --use-case --user-agent
- `shipeasy ops fired-alerts`
- `shipeasy ops fired-alerts list` — --data --status
- `shipeasy ops fired-alerts update` — --agent --assignee-id --status
- `shipeasy ops get` — --data
- `shipeasy ops investigations`
- `shipeasy ops investigations create` — --agent --completed-at --confidence --connector-id --duration-ms --findings --kind --model --pr-number --pr-url --qa-notes --question --session-id --sources --started-at --summary --tokens-used --visibility
- `shipeasy ops investigations list` — --data
- `shipeasy ops investigations update` — --completed-at --confidence --duration-ms --findings --kind --model --pr-number --pr-url --qa-notes --question --session-id --sources --summary --tokens-used --visibility
- `shipeasy ops link-pr` — --pr-number --pr-url
- `shipeasy ops list` — --data --limit --owner --status --type
- `shipeasy ops notify` — --dedupe-key --href --steps --summary --title
- `shipeasy ops trigger`
- `shipeasy ops trigger create`
- `shipeasy ops trigger create claude` — --config --enabled --events --name --token
- `shipeasy ops trigger create copilot` — --config --enabled --events --name --token
- `shipeasy ops trigger create cursor` — --api-key --config --enabled --events --name --ops-key
- `shipeasy ops trigger create jules` — --api-key --config --enabled --events --name --ops-key
- `shipeasy ops trigger prep` — --dry-run --frequency --json --model --name --project --repo
- `shipeasy ops update` — --actual-result --description --expected-result --github-pr-number --notify --priority --status --steps-to-reproduce --title --use-case
- `shipeasy projects`
- `shipeasy projects current` — --data
- `shipeasy projects update` — --auto-rollback --ci-confidence --cuped-baseline-days --cuped-min-baseline-users --cuped-min-overlap --default-allocation-pct --default-env --default-holdout --default-mei --default-power --default-winsorize-pct --domain --error-autoclose-days --error-ticket-min-occurrences --min-runtime-days --min-sample-days --min-sample-size --module-configs --module-events --module-experiments --module-feedback --module-gates --module-translations --module-user --msprt-tau-mei-factor --msprt-tau-sd-factor --name --sig-threshold --slug --srm-threshold --stat-method --timezone
- `shipeasy projects upsert` — --domain --name
- `shipeasy release`
- `shipeasy release configs`
- `shipeasy release configs archive` — --data
- `shipeasy release configs create` — --description --dev --folder --prod --schema --staging --value
- `shipeasy release configs get` — --data
- `shipeasy release configs list` — --cursor --data --limit --q
- `shipeasy release configs update` — --dev --folder --prod --schema --staging --value
- `shipeasy release configs update-schema` — --schema
- `shipeasy release flags`
- `shipeasy release flags activity` — --data --limit
- `shipeasy release flags archive` — --data
- `shipeasy release flags attributes`
- `shipeasy release flags attributes archive` — --data
- `shipeasy release flags attributes create` — --description --enum-values --required --sdk-path --type
- `shipeasy release flags attributes get` — --data
- `shipeasy release flags attributes list` — --data --q
- `shipeasy release flags attributes update` — --description --enum-values --required --sdk-path --type
- `shipeasy release flags create` — --description --enabled --folder --group --owner-email --rollout-pct --rollout-percent --rules --salt --stack --title --type
- `shipeasy release flags disable` — --data
- `shipeasy release flags enable` — --data
- `shipeasy release flags get` — --data
- `shipeasy release flags list` — --cursor --data --limit --q
- `shipeasy release flags templates`
- `shipeasy release flags templates archive` — --data
- `shipeasy release flags templates create` — --auto --category --description --icon-key --rules
- `shipeasy release flags templates get` — --data
- `shipeasy release flags templates list` — --data --q --query
- `shipeasy release flags templates update` — --auto --category --description --icon-key --name --rules
- `shipeasy release flags update` — --description --enabled --folder --group --owner-email --rollout-pct --rollout-percent --rules --stack --title --type
- `shipeasy release flags whitelist` — --data
- `shipeasy release flags whitelist-add` — --attr --entries
- `shipeasy release flags whitelist-remove` — --entries
- `shipeasy release flags whitelist-set` — --attr --entries
- `shipeasy release killswitch`
- `shipeasy release killswitch archive` — --data
- `shipeasy release killswitch create` — --description --folder --switches --value
- `shipeasy release killswitch get` — --data
- `shipeasy release killswitch list` — --cursor --data --limit --q
- `shipeasy release killswitch set` — --env --switch-key --value
- `shipeasy release killswitch set-value` — --env --value
- `shipeasy release killswitch toggle` — --env --switch-key --value
- `shipeasy release killswitch unset` — --env --switch-key
- `shipeasy release killswitch update` — --description --folder --switches --value
- `shipeasy report-issue` — --consent --description --error --frameworks --json --language --project --reporter-email --step --title
- `shipeasy root` — --json
- `shipeasy sdk`
- `shipeasy sdk keys`
- `shipeasy sdk keys create` — --env --json --name --project --scopes --type
- `shipeasy sdk keys list` — --json --project
- `shipeasy sdk keys revoke` — --json --project
- `shipeasy setup` — --agents --devtools --domain --dry-run --env --features --no-agent-run --no-bootstrap --no-claude-run --no-devtools --no-plan --no-triggers --plan --scope --skip-install --trigger-platform --triggers --yes
- `shipeasy setup triggers` — --dry-run --platform
- `shipeasy upgrade` — --agents --dry-run --only-installed --pm --scope --skip-cli --skip-sdk --yes
- `shipeasy upgrade skills` — --agents --dry-run --only-installed --pm --scope --skip-cli
- `shipeasy whoami` — --data

## Every MCP tool

Parameters and error codes: https://docs.shipeasy.ai/get-started/mcp-reference

- `release_flags_activity`
- `release_flags_archive`
- `release_flags_create`
- `release_flags_disable`
- `release_flags_enable`
- `release_flags_get`
- `release_flags_list`
- `release_flags_update`
- `release_flags_whitelist`
- `release_flags_whitelist_add`
- `release_flags_whitelist_remove`
- `release_flags_whitelist_set`
- `release_killswitch_archive`
- `release_killswitch_create`
- `release_killswitch_get`
- `release_killswitch_list`
- `release_killswitch_set`
- `release_killswitch_set_value`
- `release_killswitch_toggle`
- `release_killswitch_unset`
- `release_killswitch_update`
- `release_configs_archive`
- `release_configs_create`
- `release_configs_get`
- `release_configs_list`
- `release_configs_update`
- `release_configs_update_schema`
- `metrics_archive`
- `metrics_create`
- `metrics_grammar`
- `metrics_list`
- `metrics_series`
- `metrics_show`
- `metrics_unarchive`
- `metrics_update`
- `metrics_events_approve`
- `metrics_events_archive`
- `metrics_events_create`
- `metrics_events_get`
- `metrics_events_list`
- `metrics_events_update`
- `ops_ack`
- `ops_bug`
- `ops_create`
- `ops_feature`
- `ops_fired_alerts_list`
- `ops_fired_alerts_update`
- `ops_get`
- `ops_link_pr`
- `ops_list`
- `ops_notify`
- `ops_update`
- `ops_alerts_archive`
- `ops_alerts_channels`
- `ops_alerts_create`
- `ops_alerts_list`
- `ops_alerts_update`
- `ops_agents_list`
- `ops_comments_create`
- `ops_comments_list`
- `ops_investigations_create`
- `ops_investigations_list`
- `ops_investigations_update`
- `ops_trigger_create_claude`
- `ops_trigger_create_copilot`
- `ops_trigger_create_cursor`
- `ops_trigger_create_jules`
- `projects_current`
- `projects_update`
- `projects_upsert`
- `whoami`
- `errors_get`
- `errors_list`
- `errors_resolve`
- `errors_series`
- `auth_check`
- `auth_login`
- `auth_logout`
- `docs_get`
- `docs_list`
- `docs_skill`

## Every documentation page

- Shipeasy — https://docs.shipeasy.ai
- How it works — https://docs.shipeasy.ai/get-started/overview
- Quickstart (get-started) — https://docs.shipeasy.ai/get-started/quickstart
- Install — https://docs.shipeasy.ai/get-started/install
- Authenticate — https://docs.shipeasy.ai/get-started/authenticate
- SDKs (get-started) — https://docs.shipeasy.ai/get-started/sdks
- Keys & environments — https://docs.shipeasy.ai/get-started/keys-and-environments
- Evaluation & caching — https://docs.shipeasy.ai/get-started/evaluation-and-caching
- Identity & bucketing — https://docs.shipeasy.ai/get-started/identity-and-bucketing
- User attributes — https://docs.shipeasy.ai/get-started/attributes
- CLI — https://docs.shipeasy.ai/get-started/cli
- CLI reference — https://docs.shipeasy.ai/get-started/cli-reference
- MCP server — https://docs.shipeasy.ai/get-started/mcp
- MCP reference — https://docs.shipeasy.ai/get-started/mcp-reference
- Install in your agent — https://docs.shipeasy.ai/get-started/agents
- Scheduled triggers — https://docs.shipeasy.ai/get-started/triggers
- Team & permissions — https://docs.shipeasy.ai/get-started/team
- Project settings & modules — https://docs.shipeasy.ai/get-started/modules
- Usage & quotas — https://docs.shipeasy.ai/get-started/usage
- Troubleshooting — https://docs.shipeasy.ai/get-started/troubleshooting
- SDKs — https://docs.shipeasy.ai/sdks
- Node / TypeScript — https://docs.shipeasy.ai/sdks/node-typescript
- Browser & React — https://docs.shipeasy.ai/sdks/browser-react
- Go — https://docs.shipeasy.ai/sdks/go
- Python — https://docs.shipeasy.ai/sdks/python
- Ruby — https://docs.shipeasy.ai/sdks/ruby
- Java — https://docs.shipeasy.ai/sdks/java
- Kotlin — https://docs.shipeasy.ai/sdks/kotlin
- PHP — https://docs.shipeasy.ai/sdks/php
- Swift — https://docs.shipeasy.ai/sdks/swift
- Evaluation reasons — https://docs.shipeasy.ai/sdks/reasons
- Reacting to changes — https://docs.shipeasy.ai/sdks/onchange
- Multi-context bucketing (bucketBy) — https://docs.shipeasy.ai/sdks/bucketby
- Private attributes — https://docs.shipeasy.ai/sdks/private-attributes
- Offline & snapshots — https://docs.shipeasy.ai/sdks/offline-snapshot
- Testing — https://docs.shipeasy.ai/sdks/testing
- Devtools overlay — https://docs.shipeasy.ai/sdks/devtools-overlay
- Drop-in script tag — https://docs.shipeasy.ai/sdks/script-loader
- OpenFeature provider — https://docs.shipeasy.ai/sdks/openfeature
- Flags & Configs — https://docs.shipeasy.ai/flags
- Getting started (flags) — https://docs.shipeasy.ai/flags/getting-started
- Which primitive should I use? — https://docs.shipeasy.ai/flags/decision
- Flow & dependencies — https://docs.shipeasy.ai/flags/flow
- Feature flags — https://docs.shipeasy.ai/flags/gates
- Quickstart (flags/gates) — https://docs.shipeasy.ai/flags/gates/quickstart
- Targeting rules — https://docs.shipeasy.ai/flags/gates/targeting
- Rollouts & bucketing — https://docs.shipeasy.ai/flags/gates/rollouts
- Overrides — https://docs.shipeasy.ai/flags/gates/overrides
- Configs — typed values — https://docs.shipeasy.ai/flags/configs
- Quickstart (flags/configs) — https://docs.shipeasy.ai/flags/configs/quickstart
- Dynamic values — https://docs.shipeasy.ai/flags/configs/values
- Targeting & rollouts — https://docs.shipeasy.ai/flags/configs/targeting
- Killswitches — https://docs.shipeasy.ai/flags/killswitches
- Quickstart (flags/killswitches) — https://docs.shipeasy.ai/flags/killswitches/quickstart
- Patterns — https://docs.shipeasy.ai/flags/killswitches/patterns
- Case studies (flags) — https://docs.shipeasy.ai/flags/case-studies
- Maintenance mode with a killswitch — https://docs.shipeasy.ai/flags/case-studies/maintenance-mode
- Plan entitlements with a dynamic config — https://docs.shipeasy.ai/flags/case-studies/entitlements-with-configs
- Roll out to companies, not users (bucketBy) — https://docs.shipeasy.ai/flags/case-studies/company-rollout-bucketby
- Target on email or PII without it landing in analytics — https://docs.shipeasy.ai/flags/case-studies/private-attribute-targeting
- Debug why a user isn't seeing a feature — https://docs.shipeasy.ai/flags/case-studies/debug-missing-feature
- Invalidate a server cache the instant a config flips — https://docs.shipeasy.ai/flags/case-studies/cache-invalidation-onchange
- Deterministic flags in CI and unit tests — https://docs.shipeasy.ai/flags/case-studies/deterministic-tests
- Migrate off another flag vendor via OpenFeature — https://docs.shipeasy.ai/flags/case-studies/openfeature-migration
- QA a flag before you ramp (and share a repro link) — https://docs.shipeasy.ai/flags/case-studies/qa-with-devtools
- Disable one tenant or route without flipping the whole killswitch — https://docs.shipeasy.ai/flags/case-studies/per-tenant-killswitch
- Edge cases (flags) — https://docs.shipeasy.ai/flags/edge-cases
- Metrics — https://docs.shipeasy.ai/metrics
- Quickstart (metrics) — https://docs.shipeasy.ai/metrics/quickstart
- Aggregation types — https://docs.shipeasy.ai/metrics/aggregations
- Query DSL grammar — https://docs.shipeasy.ai/metrics/grammar
- Configure alerts — https://docs.shipeasy.ai/metrics/alerts
- Bugs & Feature Requests — https://docs.shipeasy.ai/feedback
- Getting started (feedback) — https://docs.shipeasy.ai/feedback/getting-started
- The devtools overlay — https://docs.shipeasy.ai/feedback/devtools
- Error reporting with see() — https://docs.shipeasy.ai/feedback/error-reporting
- Errors dashboard & triage — https://docs.shipeasy.ai/feedback/errors
- Connectors — https://docs.shipeasy.ai/feedback/connectors
- Slack — https://docs.shipeasy.ai/feedback/slack
- Case studies (feedback) — https://docs.shipeasy.ai/feedback/case-studies
- Route bug reports to Linear/Jira — https://docs.shipeasy.ai/feedback/case-studies/route-bugs-to-linear
- From metric alert to auto-filed ticket — https://docs.shipeasy.ai/feedback/case-studies/alert-to-ticket-loop
- Edge cases (feedback) — https://docs.shipeasy.ai/feedback/edge-cases
- API reference (feedback) — https://docs.shipeasy.ai/feedback/api
- Assistant — https://docs.shipeasy.ai/assistant
- Read vs write mode — https://docs.shipeasy.ai/assistant/read-vs-write
- Confirmation cards & plans — https://docs.shipeasy.ai/assistant/cards-and-plans
- Measurement plans — https://docs.shipeasy.ai/assistant/measurement-plans
- Credits & metering — https://docs.shipeasy.ai/assistant/credits
- Assistant use cases — https://docs.shipeasy.ai/assistant/use-cases
- API reference — https://docs.shipeasy.ai/api
- Advanced use cases — https://docs.shipeasy.ai/use-cases
