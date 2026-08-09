# Install

Source: https://docs.shipeasy.ai/get-started/install

> Add the Shipeasy SDK to your application, the CLI to your machine, and (optionally) the MCP server to your AI assistant.

Shipeasy ships as a small set of npm packages — install only the ones you need. There is one SDK, one CLI binary, and one MCP server. They all share the same login.

## Pick what you need

- **[@shipeasy/sdk](#sdk)** — The core SDK. Conditional exports pick the right build for your runtime — Node, Workers, Bun, Deno, or browser.

- **[@shipeasy/cli](#cli)** — The <code>shipeasy</code> command. Login, manage flags, configs and kill switches, work the ops queue, install the MCP server.

- **[@shipeasy/mcp](#mcp)** — MCP server for AI assistants. Installed via the CLI — your agent gets a typed toolkit.

- **[Framework adapters](#frameworks)** — Idiomatic wrappers around the browser SDK. Hooks, composables, stores, directives.

## Quick install

```bash
npm install @shipeasy/sdk
```

```bash
npm install -g @shipeasy/cli
shipeasy login
```

That's the whole runway from zero to working. Everything below is detail.

## SDK [#sdk]

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
# Gemfile
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

## CLI [#cli]

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

## MCP server [#mcp]

If you use Claude Code, Cursor, Windsurf, or any other MCP-compatible AI assistant, install the Shipeasy MCP server so your agent can do setup work for you:

shipeasy mcp install

\n? Which assistants? › Claude Code, Cursor\n✔ Wrote ~/.claude/settings.json\n✔
Wrote .cursor/mcp.json\nMCP server registered. Restart your AI assistant to pick it up.

The MCP server uses your CLI credentials — no extra env vars, no separate token. See [MCP server](https://docs.shipeasy.ai/get-started/mcp) for the tool inventory and manual config.

## Environment variables

The SDK reads the following from `process.env` (and `import.meta.env` in Vite). Anything passed explicitly to `configure({ ... })` wins.

- `SHIPEASY_SERVER_KEY` (string) — Server-side SDK key. Used by the server build. Treat as a secret.
- `NEXT_PUBLIC_SHIPEASY_CLIENT_KEY` (string) — Client-side SDK key. Safe to expose. Vite users: `VITE_SHIPEASY_CLIENT_KEY`.
- `SHIPEASY_API_BASE_URL` (string) — Override the admin API base URL (CLI default `https://shipeasy.ai`).
- `SHIPEASY_APP_BASE_URL` (string) — Override the dashboard URL the CLI links to (default `https://shipeasy.ai`).

## Frameworks [#frameworks]

- **[Node · Workers · Bun · Deno](https://docs.shipeasy.ai/get-started/sdks#server)** — `@shipeasy/sdk/server` works in any V8/Node-compatible runtime out of the box.

- **[React, Vue, Svelte, Angular](https://docs.shipeasy.ai/get-started/sdks#frameworks)** — Per-framework adapters that wrap the browser SDK with idiomatic primitives.

- **[React Native, iOS, Android](https://docs.shipeasy.ai/get-started/sdks#mobile)** — Use the server build — it has zero DOM dependencies.

- **[Ruby, Python, Go](https://docs.shipeasy.ai/get-started/sdks#ruby)** — The Ruby gem ships today. Python and Go are in beta — ping us for access.

## Edge runtimes & ESM

The SDK is shipped as ESM-first with a CJS fallback for older Node. There are no Node built-ins on the hot path, so it runs unchanged on Shipeasy, Vercel Edge, Deno Deploy, and Bun.

> **Conditional exports cheat sheet**

- `import { configure, Client } from "@shipeasy/sdk/server"` — server build, picked automatically when bundling for Node/Workers. - `import { configure, Client } from "@shipeasy/sdk/client"` — browser build, picked when bundling for the browser. - `import "@shipeasy/sdk"` — re-exports both via conditional resolution. Use this only if your bundler honours `exports`.

## Monorepo notes

In a pnpm/yarn workspace, install `@shipeasy/sdk` in each app that uses it (don't hoist it into the root unless your tooling resolves hoisted deps). For shared internal libraries that import from the SDK, depend on it as a `peerDependency` so consumers control the version.

If you depend on the SDK from a Cloudflare Worker built with `CLI`, no special config is needed — `CLI` honours `exports` and picks the right build.

## Troubleshooting

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
