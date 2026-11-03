# Trails

Source: https://docs.shipeasy.ai/feedback/trails

> Follow a ticket from intent to merge. Review agents score every push to its pull request, findings collect in one place, and merge gates decide when a change can merge.

When agents write most of the code, a diff is not enough to review a change.
You also want to know what was asked for, what the agent did, what independent
review agents think of each push, which problems are still open, and whether
CI and a person have signed off. A **trail** brings all of that into one place
and decides when the change can merge.

There is nothing new to create. The ticket **is** the trail, and its title,
description, type, priority and owner are the intent. Every pull request linked
to it (`ops link-pr`) is one of its **changes**, in whichever repository it
lives.

| On the trail | Where it comes from                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| Intent       | the ticket                                                                                                    |
| Sessions     | the agent runs on the ticket                                                                                  |
| Changes      | each linked pull request                                                                                      |
| Pushes       | the GitHub App's `pull_request` webhook (opened, synchronize, reopened, ready for review), and linking the PR |
| Evals        | your review agents, one value per agent per push                                                              |
| Findings     | what the review agents (or people) flagged on a push                                                          |
| Approvals    | a person signing off a change at a push                                                                       |
| Gates        | your project's merge requirements                                                                             |

## The loop

1. **A push lands** on a linked PR. Shipeasy records it as the change's latest
   push.
2. **Review agents run.** Every enabled review agent with the `push` trigger
   scores the push. They run in your connected coding agent (Claude, Cursor,
   Copilot or Jules), on that agent's own quota, as a read-only review: read
   the ticket, read the diff, submit. Agents that share a coding agent are
   scored in one session.
3. **Each agent submits** a value (a 0–100 score, or yes/no), a short rationale
   and any findings, through `shipeasy ops trails submit-eval` or the
   `ops_trails_submit_eval` MCP tool. The value is read against the agent's
   threshold and polarity:
   - **Pass** (green)
   - **Warn** (orange): passing, but within 10 points of the threshold
   - **Fail** (red)
4. **The coding agent iterates.** It reads the trail (`shipeasy ops trails get
   <ticket>`), fixes what is open, resolves the findings it fixed and pushes
again. Each eval shows its value on the latest push next to its last five
earlier ones, so you can see whether the loop has settled.
5. **A person approves and merges.** Merge only when confidence is high, risk is
   low and the findings are cleared.

> **Note**

After a new push, a finding raised on older code reads **earlier push**. That
marks it stale, but it stays open: resolve or dismiss it once you have checked.

## Review agents

Add them under **Settings → Ops → Trails**, or with
`shipeasy ops review-agents create`. Five presets are ready to use:

| Preset        | Scores                                              | Passes at | Blocking by default |
| ------------- | --------------------------------------------------- | --------- | ------------------- |
| `code-review` | quality, higher is better                           | ≥ 70      | no                  |
| `security`    | security risk, lower is better                      | ≤ 30      | yes                 |
| `risk`        | how much damage if it's wrong, lower is better      | ≤ 50      | no                  |
| `confidence`  | how sure it is correct and tested, higher is better | ≥ 60      | no                  |
| `slop`        | sloppy patterns and drift, lower is better          | ≤ 30      | no                  |

A custom agent takes a `key`, a `name`, `instructions` (what to review and how
to score it), a `valueType` (`score` or `boolean`), a `polarity`, a `threshold`,
whether it is `blocking`, and its `trigger`. With `push`, it runs on every
push; with `manual`, it runs only when a review is requested. It can also take
the `connectorId` of the coding agent that should run it.

```bash
shipeasy ops review-agents create --preset security
shipeasy ops review-agents create --key migrations --name "Migration risk" \
  --instructions "Score the rollout and rollback risk of any migration, lower is better" \
  --polarity lower_is_better --threshold 40 --blocking true
shipeasy ops trails review 42        # re-run the agents on the latest push now
```

## Gates

A change can merge when its PR is open and every **blocking** gate passes. A
gate that is still waiting (no approval yet, checks running, an eval pending)
blocks just like a failing one.

| Gate         | Passes when                                                                         | Default         |
| ------------ | ----------------------------------------------------------------------------------- | --------------- |
| Up to date   | the branch is not behind or in conflict with its base                               | on, report-only |
| Human review | enough distinct people approved; by default only approvals of the latest push count | on, 1 approval  |
| Agent review | no open finding at or above the severity, on the latest push                        | on, high        |
| Evals        | every blocking review agent passes on the latest push                               | on              |
| Checks       | the CI checks GitHub reports on the latest push pass (all, or a named list)         | on              |

Change them under **Settings → Ops → Trails**, or with
`shipeasy ops trail-gates set`.

**Merge** from the ticket merges the PR on GitHub at the exact push the gates
were read on: if someone pushed since, GitHub refuses. While a blocking gate
has not passed, **Merge anyway** asks for a reason, and the bypass is posted on
the ticket. GitHub's own branch protection still applies. Shipeasy approvals
and GitHub reviews are separate, and one does not count for the other.

## What agents may do

The restricted ops key a coding agent runs with may:

- read the trail
- submit evals
- resolve or dismiss findings
- request a review

It may **not** approve or merge. Those are a person's call. In `--pr` mode, the
[`shipeasy-ops-work`](https://docs.shipeasy.ai/get-started/agents) skill closes the loop on its own: it
reads the trail after linking its PR, fixes and resolves open findings, and
pushes again until no eval fails.

For agents, this prompt works well:

```text
Run `shipeasy ops trails get 42`. Summarise the intent and the open findings
on the latest push. Check each finding against the code, fix the real ones,
resolve them with the commit that fixed them, and explain any you would
dismiss. Do not approve or merge.
```
