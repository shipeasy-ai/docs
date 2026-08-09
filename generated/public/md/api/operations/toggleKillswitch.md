# Toggle a killswitch or one of its switches

Source: https://docs.shipeasy.ai/api/operations/toggleKillswitch

> >-

Flips a killswitch on one environment and publishes a new version there. This is the one-call incident verb: it reads the current value, flips it, and publishes, so you don't have to fetch the killswitch first.

Every body field is optional, which is what makes the call widen cleanly:

- **Flip the killswitch** — `{}`. Flips the flat `value` on `prod`.
- **Flip one sub-switch** — `{ "switchKey": "eu_region" }`. Flips that entry on `prod`, creating it (from `false`) if it isn't in the map yet.
- **Set it idempotently** — `{ "switchKey": "eu_region", "value": true }`. Publishes exactly that value, so a retried call can't undo the first one. A `null` `value` means "flip", not "set to null".
- **Choose the environment** — add `"env": "staging"`. Omitted, `env` is `prod`.

The response reports both `previous` and `value`, so a caller that asked for a flip can see what it actually changed.

Prefer this over `PUT /{id}/value` and `PUT /{id}/switch` unless you specifically need those endpoints' unconditional set semantics.
