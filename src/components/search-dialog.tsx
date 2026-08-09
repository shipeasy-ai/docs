"use client";

/**
 * The search dialog, with a product filter above the results.
 *
 * Five pages here are called "Quickstart" and every product ships an
 * "Overview", so an unfiltered query for either returns a column of pages with
 * the same name and no way to tell them apart. The tag comes off the page's
 * first URL segment (`buildIndex` in `app/static.json/route.ts` sets it), which
 * is the same thing the sidebar tabs are cut along — so "the section I am in"
 * and "the filter I picked" mean the same thing.
 *
 * Order matches the sidebar's, not the index's: a reader scanning for a filter
 * looks where the nav taught them to look.
 */

import DefaultSearchDialog, {
  type DefaultSearchDialogProps,
} from "fumadocs-ui/components/dialog/search-default";

const SEARCH_TAGS = [
  { name: "Get started", value: "get-started" },
  { name: "SDKs", value: "sdks" },
  { name: "Flags & Configs", value: "flags" },
  { name: "Metrics & Alerts", value: "metrics" },
  { name: "Bugs & Requests", value: "feedback" },
  { name: "Assistant", value: "assistant" },
  { name: "API", value: "api" },
];

export default function SearchDialog(props: DefaultSearchDialogProps) {
  return <DefaultSearchDialog {...props} type="static" tags={SEARCH_TAGS} allowClear />;
}
