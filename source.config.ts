import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { rehypeUseCases } from "./src/lib/rehype-use-cases";

export const { docs, meta } = defineDocs({ dir: "content/docs" });

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (v) => [rehypeUseCases, ...v],
  },
});
