# OpenFeature provider

Source: https://docs.shipeasy.ai/sdks/openfeature

> Plug Shipeasy in as the backing provider for the CNCF OpenFeature API — a pure adapter over the SDK, server and web.

If your app is standardized on the vendor-neutral [OpenFeature](https://openfeature.dev) API, Shipeasy ships a provider for both the server and web SDKs. It's a **pure adapter** over an `Engine` — same local evaluation, same deterministic bucketing, just behind the OpenFeature interface. (OpenFeature carries its own per-call context via `targetingKey`, so the provider wraps the engine directly rather than a bound `Client`.)

The OpenFeature SDKs are **optional peer dependencies** — install the one your app uses.

## Server

```ts
import { OpenFeature } from "@openfeature/server-sdk";
import { Engine } from "@shipeasy/sdk/server";
import { ShipeasyProvider } from "@shipeasy/sdk/openfeature-server";

const engine = new Engine({ apiKey: process.env.SHIPEASY_SERVER_KEY! });
await OpenFeature.setProviderAndWait(new ShipeasyProvider(engine));

const ofClient = OpenFeature.getClient();
const on = await ofClient.getBooleanValue("new_checkout", false, { targetingKey: "u1" });
```

The OpenFeature `targetingKey` maps to the Shipeasy `user_id`; any other context fields become user attributes for targeting.

## Web

```ts
import { OpenFeature } from "@openfeature/web-sdk";
import { Engine } from "@shipeasy/sdk/client";
import { ShipeasyProvider } from "@shipeasy/sdk/openfeature-web";

const engine = new Engine({ sdkKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY! });
await OpenFeature.setContext({ targetingKey: "u1", plan: "pro" });
await OpenFeature.setProviderAndWait(new ShipeasyProvider(engine));

const on = OpenFeature.getClient().getBooleanValue("new_checkout", false);
```

The browser evaluates at the edge, so the provider maps OpenFeature's static context onto `client.identify()` and reads the cached result synchronously in the resolve methods.

## Reason & error mapping

The provider maps Shipeasy [evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) onto OpenFeature's `StandardResolutionReasons`, and Shipeasy outcomes onto OpenFeature `ErrorCode`s (e.g. `FLAG_NOT_FOUND`). So `getBooleanDetails(...)` returns a standard OpenFeature `ResolutionDetails` your existing OpenFeature tooling already understands.

> **Adapter, not a fork**

The provider changes nothing about evaluation — it's a thin translation layer. If you're not
already invested in OpenFeature, the native <a href="/sdks/node-typescript">SDK API</a> is simpler
and gives you configs, kill switches, and tracking directly.

**Related**

- [Use case: migrate off another vendor via OpenFeature](https://docs.shipeasy.ai/flags/case-studies/openfeature-migration) — ShipeasyProvider in practice
- [Evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) — What gets mapped
- [Node / TypeScript](https://docs.shipeasy.ai/sdks/node-typescript) — The native API
- [Browser & React](https://docs.shipeasy.ai/sdks/browser-react)
