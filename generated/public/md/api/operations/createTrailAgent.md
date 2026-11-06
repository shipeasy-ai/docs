# Add a review agent

Source: https://docs.shipeasy.ai/api/operations/createTrailAgent

> >-

Add a review agent, from a preset (`preset: security`) or custom (`key`,
`name`, `instructions`, and how to read its value). A `push` agent runs on
every push to a linked PR through the project's coding-agent trigger (or the
one named by `connectorId`) and spends that agent's quota.

**Use case:** Add the security preset and make it blocking.
