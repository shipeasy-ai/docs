import type { ReactNode } from "react";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import * as JsxRuntime from "react/jsx-runtime";
import type { Root } from "hast";
import { createOpenAPI } from "fumadocs-openapi/server";
import { createAPIPage } from "fumadocs-openapi/ui";
import { rehypeUseCases } from "./rehype-use-cases";

/**
 * Single OpenAPI server instance pointed at the admin-api spec. Both the
 * generator script (`scripts/generate-api-reference.ts`) and the runtime
 * `<APIPage>` component must read the spec from the same path so the
 * generated MDX references resolve correctly.
 */
export const OPENAPI_SPEC_PATH = "../../packages/openapi/openapi.json";

export const openapi = createOpenAPI({
  input: [OPENAPI_SPEC_PATH],
});

function rehypeReact(this: { compiler?: (tree: Root) => ReactNode }) {
  this.compiler = (tree) =>
    toJsxRuntime(tree, {
      development: false,
      ...JsxRuntime,
    });
}

let processor: ReturnType<typeof buildProcessor> | undefined;
function buildProcessor() {
  return (
    remark()
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeUseCases)
      // unified's Plugin signature doesn't expose the `this.compiler` trick
      // directly; cast through `never` to install the React-runtime compiler.
      .use(rehypeReact as never)
  );
}

async function renderMarkdown(text: string): Promise<ReactNode> {
  processor ??= buildProcessor();
  return (await processor.process({ value: text })).result as ReactNode;
}

/**
 * `APIPage` component used by generated MDX. Bound to our OpenAPI server here
 * so the server is created exactly once per Next.js worker.
 *
 * `renderMarkdown` override applies `rehypeUseCases` so Use-case markup inside
 * OpenAPI descriptions (e.g. body schema descriptions) gets the same
 * two-column `.se-api-usecase` block treatment as the MDX-rendered top
 * description (whose pipeline is patched in `source.config.ts`).
 */
// fumadocs-openapi's typed signature wants a sync `(md) => ReactNode`, but at
// runtime it awaits the result (see its `base.js` impl). Cast through unknown
// so we can supply an async renderer without TS rejecting the Promise return.
export const APIPage = createAPIPage(openapi, {
  renderMarkdown: renderMarkdown as unknown as (md: string) => ReactNode,
});
