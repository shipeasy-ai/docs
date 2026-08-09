# Delete a feature gate

Source: https://docs.shipeasy.ai/api/operations/deleteGate

> >-

Soft-deletes the gate. Returns 409 if the gate is still referenced by a running experiment as a targeting gate — stop the experiment first.

**Use case:** Tear down a gate after a feature has fully shipped and the rollout flag is no longer needed.
