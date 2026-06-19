import { DocPageView } from "@/lib/doc-page";

// The home hub (content/docs/index.mdx) is rendered directly at "/".
// Per-page metadata is inherited from the rich root metadata in `app/layout.tsx`.
export default function RootDocPage() {
  return <DocPageView slug={[]} />;
}
