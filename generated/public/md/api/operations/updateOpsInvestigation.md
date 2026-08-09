# Update an investigation record

Source: https://docs.shipeasy.ai/api/operations/updateOpsInvestigation

> >-

Update one existing investigation record in place — the write-back seam for
the `working` run record you were handed when a run was launched. Fill in
the `summary`/`findings`, attach the fixing PR, record your `confidence`
and the `sources` you inspected, or flip its `kind` off `working` once the
investigation is done. A partial patch: send only the fields you want to
change. Safe for restricted ops keys (it never reads or deletes).

**Use case:** A run started with an empty `working` record; as you work,
PATCH it with your findings so the cockpit's detail panel fills in live —
no need to append a second record.
