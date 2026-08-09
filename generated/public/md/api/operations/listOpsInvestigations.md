# List an item's investigation records

Source: https://docs.shipeasy.ai/api/operations/listOpsInvestigations

> >-

The structured, read-only investigation records on a queue item — the
findings / blocking questions / QA notes an AI agent posted while working
it, plus its `working` run rows. Returns `published` records only, newest
first (max 50).

**Use case:** Read what a previous agent run already found before starting
your own investigation of the item.
