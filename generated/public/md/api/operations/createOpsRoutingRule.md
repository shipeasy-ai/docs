# Create a tag automation rule

Source: https://docs.shipeasy.ai/api/operations/createOpsRoutingRule

> >-

Appends one rule after the existing ones; existing rules are untouched.
The rule fires on a newly filed item carrying any of `tags` (or whose type
is in `types`) and applies its actions: `user` assigns a person,
`connector` hands the item to a connected coding agent (launching a run,
steered by `agentPrompt`), `status` / `priority` set triage fields, and
`subscribers` emails people. Tags are created on first use.

Returns `400` when the rule has no tag or type, or no action. Returns the
full rule list after the append.

**Use cases**

- **Auto-fix** — tag `ai-fix` hands the item to a connected agent with a steering prompt.
- **Triage** — every `error` ticket goes to `high` priority and an on-call email.
