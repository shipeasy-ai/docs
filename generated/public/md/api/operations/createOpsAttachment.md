# Attach a screenshot to an item

Source: https://docs.shipeasy.ai/api/operations/createOpsAttachment

> >-

Attach a screenshot, screen recording, or file to a bug or feature request, so the fixer sees what QA saw instead of reconstructing it from measurements. Send the bytes as `contentBase64` (a bare base64 string or a `data:` URI) or give a public https `url` for the server to fetch — exactly one of the two. The `kind` (`screenshot` | `recording` | `file`) defaults from the media type. Up to 25 MiB.

Error and alert tickets cannot carry attachments (`422`). Append-only: there is no replace or delete, so it is safe for restricted ops keys.

**Use case:** A QA lane captures a screenshot at verification time and the filing agent attaches it to the bug or feature request it just filed.
