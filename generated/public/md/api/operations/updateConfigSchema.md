# Update a config schema

Source: https://docs.shipeasy.ai/api/operations/updateConfigSchema

> >-

Replaces a config's JSON Schema in place. Every existing published value is re-validated against the new schema before it lands; the update fails if any value no longer validates.

**Use case:** Evolve a config's shape (add/remove a field) without republishing values.
