# Test a connector

Source: https://docs.shipeasy.ai/api/operations/testConnector

> >-

Dispatches a single synthetic `bug.created` payload to the connector's destination so you can verify the integration end-to-end. Unlike `fire`, this runs the real dispatch path (posts a Slack message / appends a Sheets row / files a GitHub Issue) with throwaway test content. The attempt's outcome is recorded on the connector's `lastAttemptAt` / `lastError` / `lastSuccessAt`.

When the provider produces a linkable artifact (e.g. a GitHub Issue), its URL is returned as `issueUrl`; otherwise `issueUrl` is `null`.

**Use case:** Click "Send test" after wiring up a connector to confirm credentials and config are correct before relying on it for real events.
