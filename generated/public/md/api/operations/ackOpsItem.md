# Ack an item (start a run)

Source: https://docs.shipeasy.ai/api/operations/ackOpsItem

> >-

Acknowledge a queue item — a person or an AI agent declaring "I'm on this
now". Opens a run: stamps who picked the item up and when, assigns them as
owner, and moves the item into the matching working status
(`investigating_by_ai` for an AI ack, `in_progress` for a human one). The
dashboard renders the open run as a live working indicator (which agent +
time since the run started).

**AI ack.** Pass `agent` with your own agent type (`claude`, `cursor`,
`copilot`, `jules`; `gemini` is also accepted and is normalized to `jules` on receipt) and, when you have one, the
run's `sessionId` so the dashboard can deep-link to the session. If the
project has no connected trigger connector of that type the call fails
with `AGENT_NOT_CONNECTED` — list the available agents with `ops agents
list` and use one of those (or connect the agent under Settings →
Triggers).

**Launching.** When the named agent has a connected trigger and you pass
no `sessionId`, the ack also fires that trigger — a new provider run
starts working the item. Pass `launch: false` to only claim the item and
record the run (you are doing the work yourself), without starting one.
A launch on an item linked to others (see `group` on `ops get`) is only
allowed on the group's master — any other member answers `409`
`INVALID_TRANSITION`, naming the master to ack instead.

**Completion.** The run closes automatically on the loop's final actions —
linking the fixing PR (`link-pr`), an ops-notify escalation, or a
completion status change (`ready_for_qa`/`resolved`) — and the dashboard
then shows the run result (final action, PR, duration, session link).

**One session per item.** An AI ack on an item whose open run belongs to
another live agent session answers `409` `ALREADY_EXISTS`, naming that
run — skip the item, the other session is working it. Your own run is
adopted, not refused: re-ack with its `runId` (a fired run's prompt names
it; a previous ack returned it) or the same `sessionId`. A run a trigger
fire claimed is adopted by the FIRST session to ack it. A run silent past
the stuck-run threshold (6h), or `takeover: true`, is superseded instead.
A human ack never replaces an open agent run.

**Use case:** Call this first when picking an item up, so the team sees
who/what is working on it in real time.
