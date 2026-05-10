import { join } from "node:path";
import { createOpenAPI } from "fumadocs-openapi/server";
import { createAPIPage } from "fumadocs-openapi/ui";

/**
 * Single OpenAPI server instance pointed at the admin-api spec. Both the
 * generator script (`scripts/generate-api-reference.ts`) and the runtime
 * `<APIPage>` component must read the spec from the same path so the
 * generated MDX references resolve correctly.
 */
export const openapi = createOpenAPI({
  input: [join(process.cwd(), "../../packages/admin-api/openapi.json")],
});

/**
 * `APIPage` component used by generated MDX under `content/docs/api-reference`.
 * Bound to our OpenAPI server here so the server is created exactly once per
 * Next.js worker.
 */
export const APIPage = createAPIPage(openapi, {});
