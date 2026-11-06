# Link a fixing PR

Source: https://docs.shipeasy.ai/api/operations/linkPrToOpsItem

> >-

Record a pull request that fixes a queue item. An item can carry several
PRs: each call ADDS one (re-linking a linked PR is a no-op), `unlink: true`
removes one, and `prNumber: null` clears them all. `connectorData.github.prs`
lists them; `github.pr` is the primary one (newest open, else newest merged).

**Use case:** Tie the fixing PR to the item so closing the PR can flip it to ready_for_qa.
