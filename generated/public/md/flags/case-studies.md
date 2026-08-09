# Case studies

Source: https://docs.shipeasy.ai/flags/case-studies

> Real scenarios — when to reach for a feature flag vs config vs killswitch.

Each case below picks one primitive, names a real-feeling scenario, and shows the code. Use them as
templates when you're stuck choosing.

- **[Roll out a redesigned checkout](#new-checkout)** —
    **Feature flag** — targeted by country, ramp 5%→25%→100% over a week. Sticky bucketing per
    `userId`.

- **[Change homepage hero copy](#hero-copy)** —
    **Config** — typed string, no code change to swap copy.

- **[Pause outbound emails during incident](#kill-emails)** —
    **Killswitch** — single bit, default-on, audited, paged via webhook on flip.

- **[Open a beta to allow-listed accounts](#beta-feature)** —
    **Feature flag** — targeting rule on `account.plan IN ['beta-tester']`, no rollout %.

- **[Tune search ranking weights](#search-relevance)** —
    **Config × 2** — one config per weight set, one more naming which set is live.

## Roll out a redesigned checkout [#new-checkout]

You finished the checkout rewrite. It passes QA, the team is convinced. Now you have to ship it to
real money-spending users without redeploying twelve times and without one rare browser quirk
torching your conversion rate for a day before you notice.

**The choice:** ship the rewrite progressively without a redeploy each ramp step.
**The primitive:** Feature flag.
**Why not a config?** There's no value to pick — it's one code path or the other. You already know
v2 is the future; you're ramping for safety, not to decide.

A feature flag gives you two knobs: a targeting rule (who's eligible at all) and a rollout percentage (of
the eligible, how many actually get the new path). Target safe geographies first — countries
where you control the payment integration end-to-end — then ramp the percentage as your dashboards
stay green. Each step is a dashboard click, not a deploy.

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY!,
  attributes: (u) => ({ user_id: u.id, country: u.country }),
});

const flags = new Client(user);
if (flags.getFlag("checkout-v2")) {
  return renderCheckoutV2();
}
return renderCheckoutV1();
```

```bash
# Day 1 — rules edited in the dashboard or via the Admin API
#         (CLI's `flags create --rules` only sets them at creation time)
shipeasy release flags update checkout-v2 --rollout-percent 5

# Day 3
shipeasy release flags update checkout-v2 --rollout-percent 25

# Day 5
shipeasy release flags update checkout-v2 --rollout-percent 100
```

## Change homepage hero copy [#hero-copy]

Marketing wants to swap the hero headline on Tuesday. Engineering does not want to ship a build on
Tuesday. Solve once: read the string from a config, let marketing edit it in the dashboard, never
touch the deploy pipeline again.

**The primitive:** Config.
**Why not a feature flag?** Feature flags are boolean. The thing you actually want to change is the _string_.

```ts
import { Client } from "@shipeasy/sdk/server";

export default function Home() {
  const flags = new Client(currentUser);
  const title = flags.getConfig<string>("home.hero.title") ?? "Ship faster.";
  const cta = flags.getConfig<string>("home.hero.cta") ?? "Get started";
  return (
    <section>
      <h1>{title}</h1>
      <Button>{cta}</Button>
    </section>
  );
}
```

`getConfig()` returns `undefined` if the SDK hasn't fetched the bundle yet or the config doesn't
exist — fall back with `??` to the value your local dev environment will read until you've
created the config. Treat the fallback as the source-of-truth copy; the dashboard value as the
_override_.

Configs hold values that vary across environments, not text that varies across languages — if the
copy needs translating, that is a different problem and a different tool.

## Pause outbound emails during incident [#kill-emails]

3am. The transactional-email provider is having an outage and your retry queue is now sending the
same "your order has shipped" email seven times. You need one switch to stop the bleeding while
you call the vendor.

**The primitive:** Killswitch.
**Why not a feature flag?** A 3am on-call shouldn't have to think about rollout percentages. Killswitches
have one switch — on or off — and they're audited so you have a paper trail of who flipped what
when.

```ts
import { Client } from "@shipeasy/sdk/server";

export async function sendOrderEmail(order: Order) {
  const flags = new Client({ user_id: order.userId });
  // `getKillswitch(name)` returns true when the killswitch is engaged (flipped to pause).
  // Read it as "are we paused?". Unknown killswitches return false (fail-open).
  if (flags.getKillswitch("emails-enabled")) {
    logger.warn("emails paused via killswitch", { orderId: order.id });
    return;
  }
  await mailer.send(order);
}
```

Killswitches are a dedicated primitive — created via `shipeasy release killswitch create` in the CLI and
read with `getKillswitch(name)` from the server SDK. Unlike feature flags, they don't bucket:
every caller sees the same answer the instant the flip propagates (within the
next SDK poll). The default is fail-open: until you flip the switch, every read returns `false`
and the protected code path keeps running.

Wire a webhook to the killswitch so when it flips, it pages the team and posts to your incident
channel. The switch itself is one bit; the social signal that someone _flipped it_ is what makes
this an actual incident response tool instead of a forgotten config field.

## Open a beta to allow-listed accounts [#beta-feature]

A handful of design-partner customers want early access to a feature you're not ready to ramp to
everyone. You don't want a deploy step every time you add or remove an account. You want a list
you can edit.

**The primitive:** Feature flag.
**The trick:** targeting rule on an account attribute, rollout fixed at 100% of the matched set.

```ts
import { Client } from "@shipeasy/sdk/server";

const flags = new Client({
  user_id: session.user.id,
  account: { id: session.account.id, plan: session.account.plan, tier: session.account.tier },
});

if (flags.getFlag("new-analytics-dashboard")) {
  return <AnalyticsV2 />;
}
return <AnalyticsV1 />;
```

In the dashboard, write the targeting rule against an attribute you actually maintain — e.g.
`account.tier IN ['beta']` — and set rollout to 100%. Adding a customer to the beta becomes "set
their tier to beta in your own database" (which you probably already have a workflow for) rather
than "redeploy with a new array literal." When you graduate the feature, drop the feature flag; don't
leave it sitting at 100% forever as dead conditional.

## Tune search ranking weights [#search-relevance]

Your search has three signals — recency, relevance score, popularity — combined as a weighted sum.
You want to find weights that maximise click-through rate. That's a parameter-search problem, not a
boolean ship/no-ship.

**The primitive:** Config (one config per weight set), selected by the user's bucket.
**Why this combo?** The bucket decides which weight set a user gets; the configs hold the weights,
so you can tune them without redeploying.

```ts
import { configure, Client } from "@shipeasy/sdk/server";

configure({ apiKey: process.env.SHIPEASY_SERVER_KEY! });

type Weights = { recency: number; relevance: number; popularity: number };
const DEFAULTS: Weights = { recency: 0.2, relevance: 0.6, popularity: 0.2 };

const flags = new Client({ user_id: userId });
// `search.weights.arm` is a config holding "control" | "a" | "b" — change the
// split in the dashboard, no deploy.
const arm = flags.getConfig<string>("search.weights.arm") ?? "control";
const weights = flags.getConfig<Weights>(`search.weights.${arm}`) ?? DEFAULTS;

const results = ranked(query, weights);
flags.track("search_results_shown", { arm, hasResults: results.length > 0 });
```

Create three configs (`search.weights.control`, `search.weights.a`, `search.weights.b`) with three
weight sets, plus `search.weights.arm` naming which one is live. Define a
[ratio metric](#ctr-ratio-metric) on clicks per impression, sliced by the `arm` property you're
already tracking, and compare the series as you move the arm. When one wins, copy its weights into
`search.weights.control` and set the arm back.

The pattern generalises: any time you have a thing-with-knobs, put the knobs in configs and keep
the selector in one more config — the values stay editable and the switch stays auditable.

## More scenarios

The five cases below are deeper cuts of the same primitives — one per page in this section's
sub-menu. Each shows a less obvious use of the tool, including the wiring that's easy to get
wrong the first time.

- **[Feature flags → progressive region rollout](#progressive-region-rollout)** —
    **Feature flag + targeting** — ramp by country list rather than percentage, expand the list
    weekly.

- **[Feature flags → block stale mobile clients](#sdk-version-gate)** —
    **Feature flag + semverGte** — disable a feature for app versions below a known-fixed build.

- **[Configs → safe price changes](#pricing-config)** —
    **Config + audit log** — change prices without deploys, with full who-changed-what trail.

- **[Configs → typed announcement banner](#typed-banner)** —
    **Config (JSON) + Zod** — schema-validated payload that's safe to read on the hot path.

- **[Metrics → CTR as a ratio metric](#ctr-ratio-metric)** —
    **Metric + ratio** — clicks per impression with correct variance via the delta method.

## Roll out by region progressively [#progressive-region-rollout]

You've got a new shipping integration that's been built region-by-region. You don't want a global
ramp — you want to expand the _country list_ as each region's integration is qualified, with the
percentage fixed at 100% of the matched set.

**The primitive:** Feature flag.
**The mechanic:** ramp by widening the targeting rule, not by raising the rollout percentage.

CLI `flags update` isn't shipped — edit the feature flag's targeting rules in
the dashboard (Feature flags → intl-shipping → Targeting), or PATCH via the
[Admin API](https://docs.shipeasy.ai/api):

```bash
GATE_ID=$(curl -sS \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  "https://shipeasy.ai/api/admin/gates?name=intl-shipping" | jq -r '.data[0].id')

# Week 2 — widen to EU
curl -X PATCH "https://shipeasy.ai/api/admin/gates/$GATE_ID" \
  -H "Authorization: Bearer $SHIPEASY_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "rules": [{"attr":"country","op":"in","value":["US","CA","GB","DE","FR","NL","IE"]}] }'
```

The rollout stays at 100% the whole time — what widens is the eligible
cohort. The code never changes:

```ts
import { Client } from "@shipeasy/sdk/server";

const flags = new Client({ user_id: userId, country });
if (flags.getFlag("intl-shipping")) {
  return renderInternationalShipping();
}
return renderDomesticOnly();
```

Why not a percentage rollout? Because the failure mode is _regional_. A 25% global rollout might
catch your DE integration in a state where it's only ready for the US — a percentage doesn't help
you. Targeting by country gives you explicit, auditable control of which regions are live.

When the launch is complete, PATCH the rules array to `[]` (or clear targeting from the dashboard)
and leave the feature flag at 100% as a kill-switch lever for incidents.

## Block stale mobile clients [#sdk-version-gate]

A bug in v2.4.1 of your mobile app sends malformed payment payloads. v2.4.2 is fixed and forced
via the app store, but old clients are stuck. You need server-side enforcement: refuse the bad
path on the API for clients below v2.4.2.

**The primitive:** Feature flag with a `semverGte` rule on the client's reported version.

```ts title="apps/api/checkout/route.ts"
import { Client } from "@shipeasy/sdk/server";

export async function POST(req: Request) {
  const appVersion = req.headers.get("x-app-version") ?? "0.0.0";

  const flags = new Client({ user_id: userId, appVersion });
  if (!flags.getFlag("checkout-v2-eligible")) {
    return Response.json(
      { error: "upgrade_required", message: "Please update to the latest app." },
      { status: 426 },
    );
  }

  return processCheckout(req);
}
```

In the dashboard:

```
Rule: appVersion semverGte "2.4.2"
Rollout: 100%
```

A user on v2.4.1 fails the rule → falls out of eligibility → gets the upgrade message. A user on
v2.5.3 passes → flows through. No code change is needed when v2.4.3 ships; the feature flag stays at
`semverGte 2.4.2` until you decide to raise the floor.

The trick that's easy to miss: `semverGte` is in [Targeting rules](https://docs.shipeasy.ai/flags/gates/targeting#operators).
Use it instead of `gte` on a string — string comparison would mis-order `2.10.0` before `2.4.0`.

## Change prices without a deploy [#pricing-config]

Marketing wants to A/B price points across geos, run a temporary promo, and roll back instantly if
the new price tanks conversion. Engineering does not want to deploy four times this week.

**The primitive:** Config (typed number) with audit log.

```ts title="lib/pricing.ts"
import { Client } from "@shipeasy/sdk/server";

const DEFAULTS: Record<string, number> = { US: 1900, GB: 1900, DE: 1900 };

export function priceForCountry(country: string, currency: string) {
  const flags = new Client({ country });
  const cents = flags.getConfig<number>(`price.pro.${country}`) ?? DEFAULTS[country] ?? DEFAULTS.US;
  return { cents, currency };
}
```

Now marketing edits the dashboard. Every change is logged with actor + timestamp + previous value,
which matters for two reasons:

1. **Compliance.** "Why was this customer charged $24 when our public price is $19?" → audit log
   shows the override window precisely.
2. **Rollback.** A bad price change is one click — the audit log's revert button restores the
   previous value across all SDKs in under a second.

What you _do not_ do: store prices in your code as constants and ship deploys to change them. The
audit story is invisible, the rollback story is "redeploy and pray," and the measurement story is
"branch the code, ship, branch the code, ship."

To trial $19 against $24, hold each price in its own config and one more naming the live one —
see the [search ranking case](#search-relevance) above for the pattern.

## Typed announcement banner [#typed-banner]

You want a site-wide announcement banner that ops can toggle on, with a structured payload
(message, severity, link, expiry). You also want the SDK to refuse to render malformed payloads —
so a typo in the dashboard JSON doesn't crash the page.

**The primitive:** Config with a Zod schema.

```ts title="lib/banner.ts"
import { Client } from "@shipeasy/sdk/server";
import { z } from "zod";

const BannerSchema = z
  .object({
    enabled: z.boolean(),
    severity: z.enum(["info", "warn", "incident"]),
    message: z.string().max(180),
    linkHref: z.string().url().optional(),
    linkLabel: z.string().max(40).optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .nullable();

export function getBanner() {
  const flags = new Client(currentUser);
  // Pass a safe-parse decoder — malformed dashboard JSON is rendered as
  // "no banner" rather than crashing the page.
  const banner = flags.getConfig("site.banner", (raw) => {
    const parsed = BannerSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("Banner config failed schema check", parsed.error.flatten());
      return null;
    }
    return parsed.data;
  });
  if (!banner?.enabled) return null;
  if (banner.expiresAt && Date.parse(banner.expiresAt) < Date.now()) return null;
  return banner;
}
```

The dashboard stores this as JSON:

```json
{
  "enabled": true,
  "severity": "warn",
  "message": "Scheduled maintenance Saturday 02:00–04:00 UTC.",
  "linkHref": "https://status.example.com/maint-2026-05-18",
  "linkLabel": "Status page",
  "expiresAt": "2026-05-19T00:00:00Z"
}
```

The schema gives you two safety properties: a fat-fingered key in the dashboard doesn't render
garbage (the schema check rejects it and the banner stays hidden), and `expiresAt` means ops can
schedule the banner to disappear without needing to remember to turn it off.

Don't reach for a feature flag for this. A feature flag is a boolean — you'd then need a _second_ config for the
payload, and now two things must be in sync. One typed config is the smaller, more honest pattern.

## CTR as a ratio metric [#ctr-ratio-metric]

You want to measure click-through rate on a redesigned recommendation rail — clicks per impression
shown. Naive instinct: log clicks, log impressions, compute the ratio in the dashboard. Wrong.

**The primitive:** Ratio metric with the delta method for variance.

```bash
shipeasy metrics create rec_rail_ctr \
  --query 'ratio(count(rec_click), count(rec_impression))'
```

```ts title="app/components/RecRail.tsx"
"use client";
import { flags } from "@shipeasy/sdk/client";
import { useEffect } from "react";

export function RecRail({ items, userId }) {
  useEffect(() => {
    items.forEach((item) => flags.track("rec_impression", { itemId: item.id }));
  }, [items, userId]);

  return items.map((item) => (
    <a
      href={item.href}
      key={item.id}
      onClick={() => flags.track("rec_click", { itemId: item.id })}
    >
      {item.title}
    </a>
  ));
}
```

Why not just compute `clicks / impressions` per user and use a `mean` metric? Because the math is
wrong. A user with 10 impressions and 1 click contributes `0.1`. A user with 1 impression and 1
click contributes `1.0`. Treating each as an equal data point inflates the apparent rate and
under-counts the high-volume users.

The ratio metric uses the **delta method** — variance is computed jointly on numerator and
denominator means, accounting for their covariance. The confidence band the dashboard draws around
the series is honest under this. Mean-of-ratios is not.

See [Metrics — aggregation types](https://docs.shipeasy.ai/metrics/aggregations#ratio) for the formal
treatment of why ratios need special handling.
