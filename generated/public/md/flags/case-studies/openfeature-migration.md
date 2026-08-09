# Migrate off another flag vendor via OpenFeature

Source: https://docs.shipeasy.ai/flags/case-studies/openfeature-migration

> Drop ShipeasyProvider in behind the OpenFeature API so your existing getBooleanValue(...) call sites keep working unchanged.

You're moving off another feature-flag vendor, and your codebase has hundreds of `getBooleanValue("new_checkout", false, ctx)` call sites scattered through it. Rewriting every one to a new SDK's API is a big, risky diff that touches files no one wants to touch. You want to swap the _backend_ without touching the call sites.

If your app already speaks [OpenFeature](https://openfeature.dev), that's exactly what the [`ShipeasyProvider`](https://docs.shipeasy.ai/sdks/openfeature) is for: it's a pure adapter over an `Engine`, so you change one line — which provider is registered — and every existing OpenFeature call keeps working.

## Swap the provider, keep the call sites

```ts
import { OpenFeature } from "@openfeature/server-sdk";
import { Engine } from "@shipeasy/sdk/server";
import { ShipeasyProvider } from "@shipeasy/sdk/openfeature-server";

const engine = new Engine({ apiKey: process.env.SHIPEASY_SERVER_KEY! });
await OpenFeature.setProviderAndWait(new ShipeasyProvider(engine));

// every existing call site is unchanged:
const ofClient = OpenFeature.getClient();
const on = await ofClient.getBooleanValue("new_checkout", false, { targetingKey: "u1" });
```

The OpenFeature `targetingKey` maps to the Shipeasy `user_id`; any other context fields become user attributes for targeting. The web SDK is the mirror image — register the provider from `@shipeasy/sdk/openfeature-web` over a browser `Engine`.

> **Adapter, not a fork**

The provider changes nothing about evaluation — same local evaluation, same deterministic
bucketing, just behind the OpenFeature interface. The OpenFeature SDKs are optional peer
dependencies; install the one your app already uses.

## Reasons come along for free

`getBooleanDetails(...)` keeps returning a standard OpenFeature `ResolutionDetails`: the provider maps Shipeasy [evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) onto `StandardResolutionReasons` and Shipeasy outcomes onto OpenFeature `ErrorCode`s (e.g. `FLAG_NOT_FOUND`). Any tooling you built around OpenFeature details still understands the output.

## Rollout & measurement plan

**Recreate the flags in Shipeasy**

Match the old vendor's flag names so the call-site keys don't change.

**Register ShipeasyProvider**

One <code>setProviderAndWait</code> line replaces the old provider registration. Call sites stay
untouched.

**Verify with details, then cut over**

Spot-check <code>getBooleanDetails</code> reasons in staging, then ship. Drop the old vendor's
dependency once nothing imports it.

Once you're stable, weigh dropping OpenFeature for the [native SDK](https://docs.shipeasy.ai/sdks/node-typescript) — it's simpler and gives you configs, kill switches, and tracking directly. But the migration itself is the cheap part precisely because the provider is a drop-in.

**Related**

- [OpenFeature provider](https://docs.shipeasy.ai/sdks/openfeature) — Server + web adapter
- [Evaluation reasons](https://docs.shipeasy.ai/sdks/reasons) — What gets mapped to StandardResolutionReasons
- [Node / TypeScript](https://docs.shipeasy.ai/sdks/node-typescript) — The native API to graduate to
