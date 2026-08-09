# List dynamic configs

Source: https://docs.shipeasy.ai/api/operations/listConfigs

> >-

Returns a single page of configs ordered by `updated_at desc, id desc`. Each row includes the latest published `version` per env and any active drafts.

**Use case:** Snapshot every config in the project — e.g. CI check that asserts no env is stuck on a stale default or that every config has a published value on prod.
