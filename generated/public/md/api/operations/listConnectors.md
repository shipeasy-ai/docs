# List connectors

Source: https://docs.shipeasy.ai/api/operations/listConnectors

> >-

Returns every connector in the project as a bare array (no pagination envelope).

The encrypted credentials backing each connector are never serialised — only the connector's non-secret `config`, `accountLabel`, and last-attempt health (`lastError`, `lastAttemptAt`, `lastSuccessAt`) are returned.

**Use case:** Render the integrations/triggers settings page, or drive a CI check that asserts every `github` connector is `enabled` and last dispatched without error.
