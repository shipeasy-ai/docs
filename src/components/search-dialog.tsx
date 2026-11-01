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

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import {
  SearchDialog as Dialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  TagsList,
  TagsListItem,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsSearch } from "fumadocs-core/search/client";
import { rankResults, rewriteQuery } from "@/lib/search-rank";

const SEARCH_TAGS = [
  { name: "Get started", value: "get-started" },
  { name: "SDKs", value: "sdks" },
  { name: "Flags & Configs", value: "flags" },
  { name: "Metrics & Alerts", value: "metrics" },
  { name: "Bugs & Requests", value: "feedback" },
  { name: "Assistant", value: "assistant" },
  { name: "API", value: "api" },
];

/** How many ranked rows to show. The engine is asked for more than this so the
 *  canonical page is in the pool even when a rarer chunk outscored it. */
const SHOWN = 60;

/**
 * Esc closes the palette, but nothing hands focus back: the trigger flips a
 * context flag instead of wrapping the dialog in a Radix Trigger, so Radix has
 * no element to restore to and focus falls to the page top — the next Tab then
 * lands on the logo and skips the pill nav. Remember what held focus when the
 * palette opened (it is still the opener at render time, before Radix moves
 * focus into the dialog) and put it back when it closes. Opened by the Cmd/Ctrl+K
 * hotkey there is no opener, so the Search button is the fallback.
 */
function useRestoreFocusOnClose(open: boolean | undefined) {
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== "undefined") {
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return undefined;
    }
    if (!wasOpen.current) return undefined;
    wasOpen.current = false;
    const frame = requestAnimationFrame(() => {
      const target =
        opener.current?.isConnected && opener.current
          ? opener.current
          : document.querySelector<HTMLElement>("button[data-search-full], button[data-search]");
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
}

/**
 * Same dialog as fumadocs' `DefaultSearchDialog`, with one difference: results
 * are re-ranked (see `src/lib/search-rank.ts`) so "feature flag", "kill switch"
 * and "alert rule" land on the page about them instead of on whichever chunk
 * the engine's BM25 liked best. `DefaultSearchDialog` cannot be told to do that —
 * it does not expose the client's `search` options or its result list.
 */
export default function SearchDialog(props: SharedProps) {
  const { locale } = useI18n();
  useRestoreFocusOnClose(props.open);
  const [tag, setTag] = useState<string | undefined>(undefined);
  // What the reader typed vs. what the engine is asked: `rewriteQuery` fixes a
  // typo ("killswtich") or turns a question into the page's own word, without
  // ever editing the text in the box.
  const [typed, setTyped] = useState("");
  const { search, setSearch, query } = useDocsSearch({
    type: "static",
    from: "/static.json",
    locale,
    tag,
    search: { limit: 200 },
  });

  const items = useMemo(
    () =>
      query.data === "empty" || !query.data
        ? null
        : rankResults(search, query.data).slice(0, SHOWN),
    [query.data, search],
  );

  return (
    <Dialog
      search={typed}
      onSearchChange={(value) => {
        setTyped(value);
        setSearch(rewriteQuery(value));
      }}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={items} />
      </SearchDialogContent>
      <SearchDialogFooter>
        <TagsList tag={tag} onTagChange={setTag} allowClear>
          {SEARCH_TAGS.map((t) => (
            <TagsListItem key={t.value} value={t.value}>
              {t.name}
            </TagsListItem>
          ))}
        </TagsList>
      </SearchDialogFooter>
    </Dialog>
  );
}
