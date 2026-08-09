"use client";

/**
 * The "try it" credentials shared between the API reference's sidebar and its
 * endpoint list — a key and a project id the reader types once and every curl
 * sample on the page picks up.
 *
 * It lives in its own module rather than beside the components that read it
 * because `api-list.tsx` statically imports the ~1 MB OpenAPI spec. All 295
 * pages share one MDX component map, so anything that map reaches eagerly is
 * downloaded by every page — importing the provider from there dragged the
 * whole spec along with it. With the provider split out, the spec is reachable
 * only through `ssr: false` boundaries, and only `/api` pays.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

interface ApiCtx {
  apiKey: string;
  setApiKey: (v: string) => void;
  projectId: string;
  setProjectId: (v: string) => void;
}

const ApiContext = createContext<ApiCtx | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState("");
  const [projectId, setProjectId] = useState("");
  return (
    <ApiContext.Provider value={{ apiKey, setApiKey, projectId, setProjectId }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi(): ApiCtx {
  const ctx = useContext(ApiContext);
  return ctx ?? { apiKey: "", setApiKey: () => {}, projectId: "", setProjectId: () => {} };
}
