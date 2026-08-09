# Set one switch entry

Source: https://docs.shipeasy.ai/api/operations/setKillswitchSwitch

> >-

Sets or updates a single `switchKey` on a single `env`. Publishes one new version on that env only — other envs untouched.

Use this for surgical per-env, per-key flips during incident response (e.g. trip `eu_region` on prod without touching the flat `value` or other envs).

**Use cases**

- **Trip a region** — `{ "env": "prod", "switchKey": "eu_region", "value": true }`.
- **Untrip without removing** — same payload with `value: false`. To remove the entry entirely use `DELETE /{id}/switch`.
