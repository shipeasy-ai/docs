"use client";

/**
 * The two MDX components heavy enough to be worth a round trip.
 *
 * Every page renders through one shared component map, so a component the map
 * imports statically ships to all 295 pages whether they use it or not. These
 * two are used by exactly one page each and drag a large dependency behind
 * them — `<ApiList>` the ~1 MB OpenAPI spec (`/api`), `<AlertChartLive>` all of
 * Recharts (`/metrics/alerts`). Between them they were most of the JS a reader
 * downloaded to look at a page of prose.
 *
 * `ssr: false` is what actually moves them: `next/dynamic` inside a Server
 * Component still lists the chunk in the page's client manifest, so the
 * boundary has to be here, in a client module. Both render post-hydration, on
 * the one page that asks for them.
 */

import dynamic from "next/dynamic";
import type { AlertChartLive as AlertChartLiveT } from "./alert-chart-live";
import type { ApiList as ApiListT } from "./api-list";

const Placeholder = ({ height }: { height: number }) => (
  <div className="se-lazy-placeholder" style={{ height }} aria-hidden />
);

export const AlertChartLive = dynamic(
  () => import("./alert-chart-live").then((m) => m.AlertChartLive),
  { ssr: false, loading: () => <Placeholder height={360} /> },
) as typeof AlertChartLiveT;

export const ApiList = dynamic(() => import("./api-list").then((m) => m.ApiList), {
  ssr: false,
  loading: () => <Placeholder height={520} />,
}) as typeof ApiListT;
