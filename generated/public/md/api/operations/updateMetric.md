# Update a metric

Source: https://docs.shipeasy.ai/api/operations/updateMetric

> >-

Update a metric's definition — folder, source event, query (`query` DSL or typed `query_ir`), winsorisation, minimum detectable effect, or direction. `name` is immutable. Provide at most one of `query` / `query_ir`.

**Use case:** Refine a metric's query or guardrail direction without recreating it.
