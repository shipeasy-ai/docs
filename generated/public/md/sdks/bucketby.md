# Multi-context bucketing (bucketBy)

Source: https://docs.shipeasy.ai/sdks/bucketby

> Bucket on company_id, session_id, or any attribute instead of user_id — so a rollout splits by account, not by individual user.

By default Shipeasy buckets on `user_id ?? anonymous_id`: a 20% rollout means 20% of _users_. `bucketBy` changes the bucketing unit so you can roll out to 20% of **companies**, keep a whole **session** on one variant, or split by **device** — whatever attribute you hash on.

## How it works

Set `bucketBy` to an attribute name on the gate. The SDK resolves the bucketing identifier from that attribute on the user object instead of `user_id`:

```ts
// make sure your attributes transform carries the bucketing attribute
configure({
  apiKey: process.env.SHIPEASY_SERVER_KEY!,
  attributes: (u) => ({ user_id: u.id, company_id: u.companyId }),
});

// the gate is configured with bucketBy: "company_id"
const flags = new Client(currentUser);
flags.getFlag("new-pricing-page");
```

Every teammate in `acme_corp` now hashes to the **same** group — the rollout splits at the account boundary, not the user boundary. The hash is still deterministic and sticky: same company, same answer, every time.

> **Configured on the resource, carried in the attribute map**

<code>bucketBy</code> is set on the gate (in the dashboard, CLI, or API). Your job in code is to
make sure the named attribute (e.g. <code>company_id</code>) is present in the attribute map your
transform produces (or on the user object you pass to the low-level <code>Engine</code>) — if it's
missing, that user falls back to individual bucketing.

## Common units

| `bucketBy`                  | Use case                                          |
| --------------------------- | ------------------------------------------------- |
| `company_id` / `account_id` | B2B — every teammate sees the same variant        |
| `session_id`                | Keep one browsing session on one experience       |
| `device_id`                 | Consistent across logged-out sessions on a device |
| `org_id`, `team_id`, …      | Any grouping you target on                        |

## The coarse-unit caveat

> **A company is one unit, not N users**

Bucketing by company makes the decision account-level, so a 5% ramp of 200 accounts is ten
accounts — the number moves in visible steps and one busy account can carry the whole metric. Read
the [metric series](https://docs.shipeasy.ai/metrics/quickstart) with that in mind before concluding the ramp is safe.

**Related**

- [Identity & bucketing](https://docs.shipeasy.ai/get-started/identity-and-bucketing) — The full bucketing model
- [Rollouts](https://docs.shipeasy.ai/flags/gates/rollouts) — Percentage ramps
- [Metrics](https://docs.shipeasy.ai/metrics/quickstart) — What to watch while the ramp climbs
