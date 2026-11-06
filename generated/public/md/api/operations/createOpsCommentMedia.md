# Upload an image to embed in a comment

Source: https://docs.shipeasy.ai/api/operations/createOpsCommentMedia

> >-

Upload an image to embed in a comment on a queue item. Takes the same body as the attachment upload (`contentBase64` or `url`). The response carries a relative `url` — reference it from the comment body as a markdown image (`![caption](url)`) in `ops comments create`, so an evidence comment shows the screenshot inline.

Append-only, safe for restricted ops keys.

**Use case:** Put a screenshot inside an evidence comment rather than on the item itself.
