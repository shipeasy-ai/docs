import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// Static on-site search for the `output: "export"` build. `staticGET` emits a
// single JSON index at /static.json that the client-side Orama search reads —
// no server, so it works on the assets-only `shipeasy-docs` Worker.
export const dynamic = "force-static";
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source);
