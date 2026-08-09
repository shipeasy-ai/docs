# Set the flat value on one env

Source: https://docs.shipeasy.ai/api/operations/setKillswitchValue

> >-

Sets the flat `value` on a single `env`, publishing one new version on that env only. `switches` and other envs are untouched.

Use this to trip (or untrip) a killswitch on one environment without replacing its per-key overrides.

**Use cases**

- **Trip on prod** — `{ "env": "prod", "value": true }`.
- **Untrip on prod** — `{ "env": "prod", "value": false }`.
