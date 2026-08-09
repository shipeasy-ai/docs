# Create an API key

Source: https://docs.shipeasy.ai/api/operations/createKey

> >-

Mints a new API key and returns the plaintext token **once** — it is stored hashed and can never be retrieved again, so capture it on creation.

Only `type` is required. `env` is **required** for `server` and `client` keys (the key is bound to one environment, which is the read-env isolation boundary); for `admin` and `ops` keys `env` is ignored and the key is pinned to `prod`. Expiry is fixed for some types: `admin` keys always get a 90-day expiry and `ops` keys a short sliding window, regardless of `expiresInDays`. Only `server`/`client` keys count toward the plan key limit.

**Use cases**

- **Back-end key** — `{ "type": "server", "env": "prod" }` for the production server SDK.
- **Public browser key** — `{ "type": "client", "env": "prod", "name": "marketing site" }` to embed in the browser SDK.
- **Scoped, expiring key** — `{ "type": "server", "env": "staging", "scopes": ["gates:evaluate"], "expiresInDays": 30 }` for a time-boxed integration.
