# Getting started

Source: https://docs.shipeasy.ai/flags/getting-started

> Install the SDK, configure once, ship a flag — under five minutes.

**Add the SDK and CLI**

```bash
npm i @shipeasy/sdk && npm i -g @shipeasy/cli
```

One package, server + browser. The CLI logs in via your browser — no env tokens.

**Authenticate**

```bash
shipeasy login
```

Opens your browser, mints an admin SDK key, stores it in `~/.config/shipeasy/`.

**Configure once, use everywhere**

```bash
// app/layout.tsx
configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY ?? '',
  attributes: (u) => ({ user_id: u.id, plan: u.plan }),
});
```

Feature flags, configs, and killswitches all share this single `apiKey`.

**Create your first feature flag**

```bash
shipeasy release flags create checkout-v2 --rollout-percent 5
```

Changes you make are visible to your SDK worldwide in under a second.

**Put a feature flag around code in your app**

```bash
import { Client } from '@shipeasy/sdk/server';
const flags = new Client(currentUser);
if (flags.getFlag('checkout-v2')) {
  return renderCheckoutV2();
}
```

Sub-millisecond evaluation. No per-request network call from your code.

## Where to next

- **[Which primitive?](https://docs.shipeasy.ai/flags/decision)** — Decision tree mapping "I want to do X" to feature flag vs config vs killswitch.

- **[Feature flags — boolean flags](https://docs.shipeasy.ai/flags/gates)** — Targeting rules, rollout percentages, hashing, sticky bucketing.

- **[Configs — typed values](https://docs.shipeasy.ai/flags/configs)** — Schema-validated strings, numbers and JSON, with per-environment drafts.

- **[CLI commands](https://docs.shipeasy.ai/get-started/cli)** — Every feature flag / config / killswitch verb the CLI exposes.

**Related**

- [Which primitive?](https://docs.shipeasy.ai/flags/decision) — Flag, config or killswitch
- [Feature flag quickstart](https://docs.shipeasy.ai/flags/gates/quickstart) — The same path, in full
- [Keys & environments](https://docs.shipeasy.ai/get-started/keys-and-environments) — Server key, client key, environments
- [Troubleshooting](https://docs.shipeasy.ai/get-started/troubleshooting) — When the first read returns the default
