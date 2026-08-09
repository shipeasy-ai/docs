# User attributes

Source: https://docs.shipeasy.ai/get-started/attributes

> The shape of the eval context — pass everything you know about the user, and Shipeasy uses it for targeting, holdouts, and analysis breakdowns.

A **user attribute** is any key/value pair you attach to a user when calling the SDK. Shipeasy uses attributes for three things:

1. **Targeting rules** on feature flags — _"only enable this for `plan = pro`"_.
2. **Bucketing** — _"bucket by `account_id` so all teammates see the same thing"_.
3. **Segmentation** in analysis — _"how did the lift differ for `country = US` vs `EU`?"_.

The richer your attribute payload, the more precise your targeting and analysis. Most teams under-invest here on day one and regret it.

## The eval context

Every SDK call that resolves a flag or config takes an **eval context** — the user object plus any attributes you want available to the rule engine.

```ts
const ctx = {
  user_id: "u_4f2a", // required for deterministic bucketing
  anonymous_id: "anon_xyz", // optional, auto-managed in the browser

  // Custom attributes — flat top-level keys
  plan: "pro",
  country: "US",
  beta_tester: true,
  team_size: 18,
  signup_at: "2026-01-12T00:00:00Z",
};

const flags = new Client(ctx);
flags.getFlag("new-checkout");
```

You bind a `Client` to the eval context once, then read with no per-call user argument. The `attributes` transform you pass to `configure()` is what maps your own user object onto this context shape — see [Install](https://docs.shipeasy.ai/get-started/install).

## Reserved attributes

Two keys are special:

- `user_id` (string) — Stable identifier for a logged-in user. Used as the default bucketing key. Pass it as soon as the user authenticates.
- `anonymous_id` (string) — Stable identifier before login. The browser SDK auto-generates and persists this in a cookie; on the server, you provide it.

Shipeasy bucketing uses `user_id ?? anonymous_id` — so a user gets a stable assignment before _and_ after login. When the user authenticates, call `shipeasy.alias(anonymous_id, user_id)` to stitch their pre-login exposures to their post-login identity. Without this stitch, exposure events from before login show up as a separate user in analysis.

> **`user_id` is required for deterministic bucketing**

Without a stable id, every evaluation gets a fresh random bucket — rollouts oscillate, metric
variants flip between page loads, and analysis falls apart. Pass `user_id` as soon as you have it;
pass `anonymous_id` for the pre-login window.

## Custom attributes

Everything else lives at the **top level** of the context object. There is no `custom: { … }` wrapper.

```ts
shipeasy.identify({
  user_id: "u_4f2a",
  plan: "pro",
  country: "US",
  signup_at: "2026-01-12T00:00:00Z",
  beta_tester: true,
  team_size: 18,
  roles: ["admin", "billing"],
});
```

Supported value types:

- `string` (primitive) — Equality, regex, contains. Most attributes are strings.
- `number` (primitive) — Numeric comparisons (`gt`, `lte`, …) and equality.
- `boolean` (primitive) — Equality only.
- `string[]` (array) — Use with `contains` for membership, or `in` for the inverse.

Nested objects are not supported — flatten them with dot-notation if you need to (`org.tier` becomes a literal key `"org.tier"`).

## Standard attributes worth passing

Most projects benefit from a few standard fields. Set them up once and your future targeting + analysis is much easier.

- **[Identity](#identity)** — `user_id` (UUID created at signup), `anonymous_id` (auto). Avoid email or username — they change.

- **[Monetisation](#monetization)** — `plan` (`free` / `pro` / `enterprise`) and `mrr_band` (`0` / `1-99` / `100+`). Most rollout lift questions cut along money.

- **[Cohort](#cohort)** — `signup_at`, `tenure_days`, `team_size`. Powerful for segmenting by maturity.

- **[Geography & locale](#geo)** — `country` (ISO-2), `locale` (BCP-47). Lets you regionalise rollouts and stops you running an EU-wide test on a US-only feature.

- **[Device](#device)** — `platform` (`web` / `ios` / `android`), `app_version`. The browser SDK fills `platform` automatically; you fill `app_version`.

- **[B2B hierarchy](#org)** — `account_id`, `org_id`, `role`. For B2B, bucket rollouts by `account_id` so all teammates see the same variant.

## Registering attributes in the dashboard

Go to **Project → User attributes → Register** and declare the attributes you plan to send. Registration is **optional** but unlocks two things:

1. The dashboard rule builder can autocomplete attribute names and validate types.
2. Registered attributes become the labels you can filter and slice a metric series by.

Unregistered attributes still work — they just won't appear in pickers.

## Targeting operators

Targeting rules use these operators against attribute values:

- `eq / neq` (any) — Strict equality.
- `in / not_in` (scalar vs array) — is this value in the list". Use the inverse to negate.
- `gt / gte / lt / lte` (number) — Numeric comparison.
- `contains` (string ⊂ string · value ⊂ array) — Substring or membership.
- `regex` (string) — JS regex match. Anchor your patterns.

Multiple rules on a feature flag are **AND**ed. Use `in` with a list to express OR. Rule order doesn't matter — there is no fall-through.

## Server vs browser

On the **server**, you bind a `Client` to the context, then read with no user argument:

```ts
const flags = new Client({ user_id, plan, country });
flags.getFlag("new-ui");
```

In the **browser**, you bind the `Client` once after the user logs in and reuse it for every subsequent flag / config read:

```ts
const flags = new Client({ user_id, plan, country });

if (flags.getFlag("new-ui")) {
  // …
}
```

## Anonymous IDs

Before login, the browser SDK auto-generates an `anonymous_id` and persists it in a cookie. The cookie is `Lax`, `Secure` (in production), and scoped to your domain.

On the server, generate an anonymous ID yourself — a UUID stored in `AsyncStorage` (React Native) or a session cookie (server-rendered apps) is the right pattern. The SDK doesn't care where the value comes from, only that it's stable per browser/device.

When the user logs in:

```ts
shipeasy.alias(anonymous_id, user_id);
```

This call writes a single row to D1 mapping the two IDs. The next analysis run merges their exposures into one user.

## Bucketing by an attribute

By default Shipeasy buckets users by `user_id`. To bucket by something else (typical for B2B: bucket by account so teammates align):

```ts
const flags = new Client({
  user_id: "u_4f2a",
  account_id: "acct_910",
  plan: "pro",
});
flags.getFlag("new-ui");
```

Set the gate's `bucket_by` to `account_id` in the dashboard so every read keys on the account attribute you pass on the bound client. The same identity is then used for both bucketing and exposure stitching.

## Privacy & PII

Shipeasy stores attributes you send as part of exposure events for analysis. **Don't send PII you wouldn't want in your analytics warehouse.**

> **Hard rules**

- Pass user **IDs**, not emails. Emails are PII and they change. - Pass `country`, not full IP. Shipeasy already derives a coarse geo from the request. - Hash anything sensitive on your side first — names, phone numbers, account secrets. - Never put an API token, password, or session cookie into an attribute.

A handful of fields are auto-treated:

- `email` (string) — Auto-hashed before write. Only the hash is stored. Useful only for cohort lookup, never for targeting on substrings.
- `ip` (string) — Coarsened to country + region. Full IP is dropped before write.
- `user_id` (string) — Stored as-is. Use a UUID, not an email.

You can set per-attribute retention in **Project → Privacy**; the default is plan-derived and shown there. Past the window, exposure rows are aggregated and the per-user attribute payload is dropped.

## Troubleshooting

> **Targeting rules don't match**

Two common causes: type mismatch (`"5"` is not `5`) and missing attribute (an undefined attribute
fails every comparison except `not_in` against a list that contains it). Check the
dashboard's **Test rules** panel — paste a sample context, see exactly which rules pass.

> **A flag flips between page loads**

You're evaluating without a stable `user_id`. Either pass `user_id` (preferred) or pass a
stable `anonymous_id` for the pre-login window.

**Related**

- [Targeting rules](https://docs.shipeasy.ai/flags/gates/targeting) — What the attributes are for
- [Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing) — The two ids, and which one sticks
- [Private attributes](https://docs.shipeasy.ai/sdks/private-attributes) — Target on it without persisting it
- [Target on PII safely](https://docs.shipeasy.ai/flags/case-studies/private-attribute-targeting) — The worked example
