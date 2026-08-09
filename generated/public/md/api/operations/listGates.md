# List feature gates

Source: https://docs.shipeasy.ai/api/operations/listGates

> >-

Returns a single page of gates ordered by `updated_at desc, id desc`. Use the `cursor` query parameter to paginate.

**Use case:** Snapshot every gate in the project — for example to render an admin overview or to drive a CI check that asserts no gate is left at 100% in staging.
