# Close a trail

Source: https://docs.shipeasy.ai/api/operations/closeTrail

> >-

Close a trail by hand — abandoned, superseded, or shipped with discovered items still open. A trail also closes on its own once it is `shipped` with no discovered item open at `high` priority or above. Closing never merges or closes pull requests. A trail closed with nothing merged reads `closed`; one that merged keeps its `releasing`/`shipped` phase.

Closing is a person's call: the restricted ops key cannot close a trail.
