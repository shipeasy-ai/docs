# SDKs

Source: https://docs.shipeasy.ai/get-started/sdks

> One package, two builds — server and browser. Plus framework adapters, native runtimes, and a DevTools overlay.

The TypeScript SDK ships in `@shipeasy/sdk` with conditional exports for Node, Shipeasy, Bun, Deno, and the browser. Bundlers pick the right build automatically; you can also import the explicit subpath if you want to be unambiguous.

Other languages have first-party adapters or community ports — see [Ruby](#ruby), [Python & Go](#python--go) below.

## Server SDK [#server]

Use this on your backend (Node, Workers, Bun, Deno, Next.js Server Components, etc.). The server SDK polls the rule blobs in the background and evaluates locally — there is no per-request network call from your code.

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan, country: u.country }),
});
```

`configure()` is idempotent — call it from the framework entry point that runs once per cold start (Next.js root `layout.tsx`, an Express app initialiser, your Worker `fetch` handler). The optional `attributes` transform maps your user object onto the Shipeasy attribute map used by every bound `Client`.

If you need to override the env or base URL (rare — defaults are correct
for almost everyone), pass `env` / `baseUrl` to `configure({ apiKey, env, baseUrl })`.

### Evaluating a feature flag

```ts
const flags = new Client(currentUser);
const enabled = flags.getFlag("new-checkout-flow");
```

Bind a `Client` to the user once, then read with no per-call user argument. `getFlag()` is **synchronous** — the rule set lives in process memory. The attributes available to targeting rules come from the `attributes` transform you passed to `configure()` — see [User attributes](https://docs.shipeasy.ai/get-started/attributes) for the full guide.

### Reading a dynamic config

```ts
const pricing = flags.getConfig<{ base: number; currency: string }>("pricing");
const base = pricing?.base ?? 9.99;
```

Configs are typed via the optional generic. Always provide a fallback — your code should never crash because the SDK hasn't initialised yet.

### Logging an event

```ts
flags.track("u_4f2a", "purchase", { value: 49.99, sku: "SHIRT-L-BLUE" });
```

`track()` is fire-and-forget. Events are batched and sent to `/collect` on the Shipeasy edge.

## Browser SDK [#browser]

Use this in the browser (Vite, Webpack, Next.js client, plain HTML). The browser SDK manages an `anonymous_id` cookie, fetches an evaluation bundle on init, and batches event uploads with `navigator.sendBeacon` on page hide.

```ts
import { configure, Client } from "@shipeasy/sdk/client";

configure({
  clientKey: import.meta.env.VITE_SHIPEASY_CLIENT_KEY ?? "",
  attributes: (u) => ({ user_id: u.id, plan: u.plan }),
});

const flags = new Client(currentUser);
await flags.ready();

if (flags.getFlag("new-checkout-flow")) {
  // …
}

flags.track("checkout_viewed", { source: "nav" });
```

### Server-side rendering bootstrap

For Next.js / Remix / SvelteKit, `configure()` once at startup, then bind a
`Client` to the request user and read flags, configs and kill switches directly:

```tsx title="app/layout.tsx"
import { configure, Client } from "@shipeasy/sdk/server";

configure({ apiKey: process.env.SHIPEASY_SERVER_KEY ?? "" });

const flags = new Client({ user_id: session?.user?.id });

if (flags.getFlag("new-checkout-flow")) {
  // render the new flow
}
```

The server-rendered evaluation lands on `window.__SE_BOOTSTRAP` for the
client SDK to pick up — no flicker. Configure the client with
`configure({ clientKey })` and the bootstrap auto-hydrates before your
first read.

## Framework usage [#frameworks]

Shipeasy ships a single SDK — `@shipeasy/sdk` — that works from plain JavaScript. Every API (`getFlag`, `getConfig`, `getKillswitch`, `track`) is callable directly from React, Vue, Svelte, Angular, or vanilla JS without any framework-specific wrapper.

```tsx title="React"
import { useEffect, useState } from "react";
import { configure, Client } from "@shipeasy/sdk/client";

configure({
  clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "",
  attributes: (u) => ({ user_id: u.id }),
});

const flags = new Client(currentUser);

function CheckoutButton() {
  const [enabled, setEnabled] = useState(() => flags.getFlag("new-checkout-flow"));
  useEffect(() => {
    const onChange = () => setEnabled(flags.getFlag("new-checkout-flow"));
    window.addEventListener("se:override:change", onChange);
    return () => window.removeEventListener("se:override:change", onChange);
  }, []);
  return <button>{enabled ? "Pay now" : "Pay"}</button>;
}
```

The browser SDK dispatches the `se:override:change` event whenever a
re-poll updates the cached blob or the devtools overlay flips an
override. Wrap that listener in whatever reactivity primitive your
framework provides (Vue's `onMounted` + `onUnmounted`, Svelte's
`onMount`, Angular's `ngOnInit`, etc.).

### A note on vanilla JS [#vanilla-js]

Every Shipeasy SDK API works from plain JavaScript. You can drop the SDK into a plain `<script>` tag, an Astro island, an HTMX page, or a vanilla TS app, and every primitive — feature flags, configs, kill switches — works without any framework.

## React Native & mobile [#mobile]

Use the **server build** in React Native — the client build assumes a DOM:

```ts
import { configure, Client } from "@shipeasy/sdk/server";
```

Provide a stable `anonymous_id` — for example a UUID stored in `AsyncStorage`. The SDK has zero DOM dependencies in this build and works fine in the Hermes engine.

For native iOS and Android there are first-class SDKs — [Swift](https://docs.shipeasy.ai/sdks/swift) and [Kotlin](https://docs.shipeasy.ai/sdks/kotlin) — so you don't need the React Native bridge or hand-rolled `/sdk/*` calls.

## Ruby [#ruby]

A Ruby gem is published as `shipeasy-sdk` on RubyGems:

```ruby
require "shipeasy-sdk"

Shipeasy.configure do |c|
  c.api_key = ENV.fetch("SHIPEASY_SERVER_KEY")
  c.attributes = ->(u) { { user_id: u.id, plan: u.plan } }
end

flags = Shipeasy::Client.new(current_user)
if flags.get_flag("new-checkout-flow")
  # …
end
```

The gem mirrors the JS API surface. Polling, evaluation and exposure events all behave the same.

### Rails

In a Rails app, drop the `Shipeasy.configure` block above into `config/initializers/shipeasy.rb` and you're done — the gem auto-mounts its view helpers via a Railtie. In plain Ruby (Sinatra, Hanami, scripts) the Rails surface is skipped automatically.

## Python & Go

Both are published and production-ready, same wire format and same mental model:

```python title="Python"
import shipeasy

shipeasy.configure(
    api_key=os.environ["SHIPEASY_SERVER_KEY"],
    attributes=lambda u: {"user_id": u.id, "plan": u.plan},
)

flags = shipeasy.Client(current_user)
if flags.get_flag("new-checkout-flow"):
    ...
```

```go title="Go"
shipeasy.Configure(shipeasy.Options{
    APIKey: os.Getenv("SHIPEASY_SERVER_KEY"),
})

flags := shipeasy.NewClient(currentUser)
if flags.GetFlag("new-checkout-flow") {
    // ...
}
```

Full per-language reference: [Python](https://docs.shipeasy.ai/sdks/python), [Go](https://docs.shipeasy.ai/sdks/go) — and the same for
[Java](https://docs.shipeasy.ai/sdks/java), [Kotlin](https://docs.shipeasy.ai/sdks/kotlin), [PHP](https://docs.shipeasy.ai/sdks/php) and [Swift](https://docs.shipeasy.ai/sdks/swift).

## DevTools overlay [#devtools]

Add `?shipeasy=1` to any URL on a site running the browser SDK and a debugging overlay appears. You can inspect every feature flag, every config, every label, and **override values locally** — no rule changes, no redeploys, scoped to your browser only.

```ts
import { loadDevtools } from "@shipeasy/sdk/client";

if (process.env.NODE_ENV !== "production") loadDevtools();
```

Useful for QA, dogfooding new variants, walking a customer through what they should be seeing, and inspecting the runtime variables a label or config is using.

> **The overlay is local-only**

Overrides are stored in `localStorage`. They affect only the browser tab where they're set;
analytics and exposure events are tagged so you can filter them out of analysis.

> **Don't put a server key in client code**

The two key kinds aren't interchangeable. Server keys can read full payloads and write
events; they don't belong in a bundle. Put the **client** key in the browser and the
**server** key in your server runtime — both come from **Project → SDK keys**.

**Related**

- [SDK reference](https://docs.shipeasy.ai/sdks) — Every language, method by method
- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — Server key vs client key
- [Browser & React](https://docs.shipeasy.ai/sdks/browser-react) — The client build in detail
- [Testing](https://docs.shipeasy.ai/sdks/testing) — Seed values instead of hitting the network
