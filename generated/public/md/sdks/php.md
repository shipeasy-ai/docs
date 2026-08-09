# PHP

Source: https://docs.shipeasy.ai/sdks/php

> The Shipeasy PHP server SDK — PHP-FPM friendly per-request init, local evaluation, configs, kill switches, and metric tracking.

> **Note**
Generated from the PHP SDK repo's own `/docs/` — the same Markdown `shipeasy docs get --sdk php overview` returns, served raw at [`https://shipeasy-ai.github.io/sdk-php/pages/overview.md`](https://shipeasy-ai.github.io/sdk-php/pages/overview.md). Edit it in the SDK repo, not here.

`shipeasy/shipeasy` is the **PHP server SDK** for Shipeasy — feature flags
(gates), dynamic configs, kill switches, A/B experiments, metric tracking,
`see()` error reporting, and i18n SSR helpers. It targets **PHP 8.1+** and runs
anywhere PHP runs: plain PHP, Laravel, Symfony, WordPress, Slim. It is PHP-FPM
friendly — `Shipeasy\configure()` fetches once per request, with **no background
poll thread**.

## Install

```bash
composer require shipeasy/shipeasy
```

Full wiring — frameworks, options, env vars — is in [Installation](https://docs.shipeasy.ai/sdks/reference/php/installation).

## Quickstart

Configure the process-wide SDK **once** at startup, then bind a user per request
with `new Shipeasy\Client($user)`:

```php
use function Shipeasy\configure;
use Shipeasy\Client;

// once, at startup — pass the SERVER key (never the client key):
configure($_ENV['SHIPEASY_SERVER_KEY']);

// per request — bind the user, then read:
$client  = new Client($currentUser);              // construct once per callsite
$enabled = $client->getFlag('new_checkout');      // bool
```

That is the whole mental model: one `configure()` at boot, one
`new Client($user)` per request, and the bound client answers every read.

## What the bound `Client` gives you

`new Client($user)` is **cheap**: it runs the configured `attributes` transform
on your user once, merges the request's `__se_anon_id` for logged-out traffic,
and then forwards every call to the configured SDK with that user baked in — so
no read takes a user argument:

```php
$client = new Client($currentUser);                // construct once per callsite

$enabled = $client->getFlag('new_checkout');                       // gate
$copy    = $client->getConfig('billing_copy');                     // dynamic config
$panic   = $client->getKillswitch('payments_panic');               // kill switch
$cta     = $client->universe('checkout')->assign();                // experiment (by universe)
$color   = $cta->get('button_color', 'red');                       // variant ?? universe default ?? fallback
$client->track('checkout_completed', ['amount' => 49]);            // metric event (auto-logs exposure on assign)
```

Constructing a `Client` before `configure()` throws `RuntimeException`.

## Package-level helpers

A handful of package-level functions cover the cases that aren't per-user reads —
all backed by the same configured SDK, so you never construct anything heavy:

- `Shipeasy\configure()` / `configureForTesting()` / `configureForOffline()` — setup.
- `Shipeasy\overrideFlag()` / `overrideConfig()` / `overrideExperiment()` / `clearOverrides()` — test overrides.
- `Shipeasy\see()` / `seeViolation()` / `controlFlowException()` — error reporting.
- `Shipeasy\bootstrapScriptTag()` / `i18nScriptTag()` / `devtoolsScriptTag()` — SSR script tags (every argument optional; defaults from `configure()`).
- `Shipeasy\onChange()` — change listener (long-running runtimes only).

## Pages

- [Installation](https://docs.shipeasy.ai/sdks/reference/php/installation) — `composer require` + per-framework wiring + the full `configure()` reference.
- [Configuration](https://docs.shipeasy.ai/sdks/reference/php/configuration) — the `configure()` options in detail.
- [Flags](https://docs.shipeasy.ai/sdks/reference/php/flags) — `getFlag` / `getFlagDetail`.
- [Configs](https://docs.shipeasy.ai/sdks/reference/php/configs) — `getConfig`.
- [Kill switches](https://docs.shipeasy.ai/sdks/reference/php/killswitches) — `getKillswitch`.
- [Error reporting](https://docs.shipeasy.ai/sdks/reference/php/error-reporting) — `see()` / `controlFlowException()`.
- [Testing](https://docs.shipeasy.ai/sdks/reference/php/testing) — `configureForTesting()` / `configureForOffline()` + overrides.
- [OpenFeature](https://docs.shipeasy.ai/sdks/reference/php/openfeature) — `ShipeasyProvider`.
- [Advanced](https://docs.shipeasy.ai/sdks/reference/php/advanced) — manual exposure, private attributes, sticky bucketing, anonymous-id bucketing, snapshots.

The blocks below are the SDK repo's own snippets — the same ones `shipeasy docs get --sdk php release/flags` returns, with a worked example baked in.

## Feature flags

Read a flag with a user-bound `Client`. Assumes `Shipeasy\configure()` ran at
startup — see Installation.

```php
use Shipeasy\Client;

// construct once per callsite (cheap; binds the user)
$client = new Client($currentUser);

$enabled = $client->getFlag(
    'new_checkout',   // gate name
    false,            // optional $default — returned ONLY when unevaluable
);                    //   (SDK not ready / flag not in blob), NOT when the gate is off
```

## Dynamic configs

Read a dynamic config value (with a fallback for the absent case). Assumes
`Shipeasy\configure()` ran at startup — see Installation.

```php
use Shipeasy\Client;

// construct once per callsite (cheap; binds the user)
$client = new Client($currentUser);

$value = $client->getConfig(
    'billing_copy',                // config name
    ['headline' => 'Welcome'],       // optional $default — returned when the config key is absent
);
```

## Kill switches

Read a kill switch (global panic boolean). Assumes `Shipeasy\configure()` ran at
startup — see Installation.

```php
use Shipeasy\Client;

// construct once per callsite (cheap; binds the user)
$client = new Client($currentUser);

$panic = $client->getKillswitch(
    'payments',   // kill switch name
    null,                   // optional $switchKey — read a named per-key override
);                          //   (null = top-level value; unconfigured key falls back to it too)
```

## Track a conversion

Track a metric/conversion event from the bound `Client`. Metrics in the dashboard
are computed from these events. Assumes `Shipeasy\configure()` ran at startup —
see Installation.

### Track an event

```php
use Shipeasy\Client;

// construct once per callsite (cheap; binds the user)
$client = new Client($currentUser);

// track($event, $props = [])
//   $event — the event your metric is built on (required)
//   $props — optional payload; numeric/string fields you can sum/filter on
//            in a metric (private attributes are stripped before egress)
$client->track('checkout_started', ['amount' => 49, 'currency' => 'usd']);
```

Fire-and-forget (never blocks your response) and a no-op under
`Shipeasy\configureForTesting()` / `Shipeasy\configureForOffline()`. The unit is
the bound user (`user_id`, else `anonymous_id`); with no unit the call is a no-op.

### Track without properties

```php
use Shipeasy\Client;

// construct once per callsite
$client = new Client($currentUser);

$client->track('checkout_started');   // $props are optional
```

**Related**

- [PHP full reference](https://docs.shipeasy.ai/sdks/reference/php) — Every feature page
- [Shared evaluation model](https://docs.shipeasy.ai/sdks) — How every SDK buckets
- [Testing](https://docs.shipeasy.ai/sdks/reference/php/testing) — Seed values, zero network
- [Error reporting](https://docs.shipeasy.ai/sdks/reference/php/error-reporting) — The see() surface
