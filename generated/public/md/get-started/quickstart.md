# Quickstart

Source: https://docs.shipeasy.ai/get-started/quickstart

> Install the SDK and CLI, bind a project, wire one init call, ship a flag at 0%, and ramp — in about five minutes.

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

## Configure and read a flag, in your language

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

## What just happened

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

## Branch to your product

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
