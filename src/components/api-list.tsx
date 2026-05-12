"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import spec from "../../../../packages/openapi/openapi.json";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type Lang = "curl" | "js" | "python";

interface OpParameter {
  name: string;
  in: "path" | "query" | "header";
  required?: boolean;
  description?: string;
  schema?: { type?: string };
}

interface BodyField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
}

interface Operation {
  method: Method;
  path: string;
  operationId: string;
  summary: string;
  description?: string;
  tag: string;
  parameters: OpParameter[];
  bodyFields: BodyField[];
  responseFields: BodyField[];
  requestExample?: unknown;
  responseExample?: unknown;
  responseStatus: string;
  useCases: UseCase[];
}

type SpecPaths = Record<string, Record<string, unknown>>;
type RefParam = { $ref: string };
type RawParam = OpParameter | RefParam;
type JsonSchema = {
  $ref?: string;
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  default?: unknown;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  format?: string;
};
type RawExample = { summary?: string; description?: string; value: unknown };
type RawMedia = {
  example?: unknown;
  examples?: Record<string, RawExample>;
  schema?: JsonSchema;
};
type RawOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: RawParam[];
  requestBody?: { content?: Record<string, RawMedia> };
  responses?: Record<string, { content?: Record<string, RawMedia> }>;
};

interface UseCase {
  title: string;
  description: string;
  exampleKey?: string;
  exampleSummary?: string;
  exampleValue?: unknown;
}

function resolveParam(p: RawParam): OpParameter | null {
  if ("$ref" in p) {
    const name = p.$ref.split("/").pop() ?? "";
    if (name === "ProjectId") {
      return {
        name: "X-Project-Id",
        in: "header",
        required: true,
        description: "Project to scope this request to.",
        schema: { type: "string" },
      };
    }
    if (name === "PaginationLimit") {
      return {
        name: "limit",
        in: "query",
        description: "Max results per page (default 50, max 500).",
        schema: { type: "number" },
      };
    }
    if (name === "PaginationCursor") {
      return {
        name: "cursor",
        in: "query",
        description: "Opaque pagination cursor from a prior page's `next_cursor`.",
        schema: { type: "string" },
      };
    }
    return null;
  }
  return p;
}

const SCHEMAS: Record<string, JsonSchema> = ((
  spec as { components?: { schemas?: Record<string, JsonSchema> } }
).components?.schemas ?? {}) as Record<string, JsonSchema>;

function resolveSchema(s: JsonSchema | undefined): JsonSchema | null {
  if (!s) return null;
  if (s.$ref) {
    const name = s.$ref.split("/").pop() ?? "";
    return SCHEMAS[name] ?? null;
  }
  return s;
}

const MAX_OBJ_DEPTH = 2;
const MAX_ENUM_INLINE = 12;

function typeLabel(s: JsonSchema | undefined, depth = MAX_OBJ_DEPTH): string {
  if (!s) return "any";
  if (s.$ref) {
    const resolved = resolveSchema(s);
    return resolved ? typeLabel(resolved, depth) : (s.$ref.split("/").pop() ?? "any");
  }
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum && s.enum.length > 0) {
    if (s.enum.length <= MAX_ENUM_INLINE) {
      return s.enum.map((v) => JSON.stringify(v)).join(" | ");
    }
    return (Array.isArray(s.type) ? s.type.join(" | ") : s.type) ?? "enum";
  }
  const variants = s.anyOf ?? s.oneOf;
  if (variants && variants.length > 0) {
    return variants.map((v) => typeLabel(v, depth)).join(" | ");
  }
  if (s.type === "array") {
    return `array<${typeLabel(s.items, depth)}>`;
  }
  if (s.properties) {
    if (depth <= 0) return "object";
    const req = new Set<string>(s.required ?? []);
    const parts = Object.entries(s.properties).map(([k, v]) => {
      const optional = !req.has(k) || v.default !== undefined;
      return `${k}${optional ? "?" : ""}: ${typeLabel(v, depth - 1)}`;
    });
    return `{ ${parts.join("; ")} }`;
  }
  if (Array.isArray(s.type)) return s.type.join(" | ");
  return s.type ?? "any";
}

function extractFields(rawSchema: JsonSchema | undefined): BodyField[] {
  const resolved = resolveSchema(rawSchema);
  if (!resolved?.properties) return [];
  const req = new Set<string>(resolved.required ?? []);
  return Object.entries(resolved.properties).map(([name, prop]) => {
    const hasDefault = prop.default !== undefined;
    return {
      name,
      type: typeLabel(prop),
      required: req.has(name) && !hasDefault,
      description: prop.description,
      defaultValue: prop.default,
    };
  });
}

function descTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3),
  );
}

function matchExampleKey(title: string, examples: Record<string, RawExample>): string | null {
  const bt = descTokens(title);
  if (bt.size === 0) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const [k, ex] of Object.entries(examples)) {
    const et = new Set<string>([...descTokens(k), ...descTokens(ex.summary ?? "")]);
    let score = 0;
    for (const t of bt) if (et.has(t)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return bestScore > 0 ? best : null;
}

function parseUseCases(
  description: string | undefined,
  examples: Record<string, RawExample>,
): { intro: string; cases: UseCase[] } {
  if (!description) return { intro: "", cases: [] };
  const marker = description.indexOf("**Use cases**");
  if (marker < 0) return { intro: description, cases: [] };
  const intro = description.slice(0, marker).replace(/\s+$/, "");
  const tail = description.slice(marker + "**Use cases**".length);
  const cases: UseCase[] = [];
  for (const line of tail.split(/\n/)) {
    const m = line.match(/^\s*-\s+\*\*(.+?)\*\*\s*[—-]\s*(.+)$/);
    if (!m) continue;
    const title = m[1].trim();
    const body = m[2].trim();
    const exKey = matchExampleKey(title, examples);
    const uc: UseCase = { title, description: body };
    if (exKey) {
      uc.exampleKey = exKey;
      uc.exampleSummary = examples[exKey].summary;
      uc.exampleValue = examples[exKey].value;
    }
    cases.push(uc);
  }
  return { intro, cases };
}

const ALL_OPS: Operation[] = (() => {
  const out: Operation[] = [];
  const paths = (spec as { paths: SpecPaths }).paths;
  const methods: Method[] = ["GET", "POST", "PATCH", "PUT", "DELETE"];
  for (const [path, item] of Object.entries(paths)) {
    for (const [method, raw] of Object.entries(item)) {
      const m = method.toUpperCase() as Method;
      if (!methods.includes(m)) continue;
      const op = raw as RawOperation;
      const parameters: OpParameter[] = (op.parameters ?? [])
        .map((p) => resolveParam(p))
        .filter((p): p is OpParameter => p !== null);
      const reqMedia = op.requestBody?.content?.["application/json"];
      const examples = reqMedia?.examples ?? {};
      const firstExampleValue =
        Object.keys(examples).length > 0 ? Object.values(examples)[0]?.value : undefined;
      const requestExample = reqMedia?.example ?? firstExampleValue;
      const bodyFields = extractFields(reqMedia?.schema);
      const responses = op.responses ?? {};
      const successStatus = Object.keys(responses).find((s) => s.startsWith("2")) ?? "200";
      const resMedia = responses[successStatus]?.content?.["application/json"];
      const responseExample = resMedia?.example ?? undefined;
      const responseFields = extractFields(resMedia?.schema);
      const { intro, cases: useCases } = parseUseCases(op.description, examples);
      out.push({
        method: m,
        path,
        operationId: op.operationId ?? `${m}_${path}`,
        summary: op.summary ?? "",
        description: intro || undefined,
        tag: op.tags?.[0] ?? "Default",
        parameters,
        bodyFields,
        responseFields,
        requestExample,
        responseExample,
        responseStatus: successStatus,
        useCases,
      });
    }
  }
  return out;
})();

const SERVER = "https://shipeasy.ai";

function curlSample(op: Operation, key: string, projectId: string) {
  const url = SERVER + op.path.replace(/\{(\w+)\}/g, ":$1");
  const lines = [`curl -X ${op.method} '${url}' \\`];
  lines.push(`  -H 'Authorization: Bearer ${key || "<your-admin-key>"}' \\`);
  lines.push(`  -H 'X-Project-Id: ${projectId || "<project-id>"}' \\`);
  if (op.requestExample !== undefined) {
    lines.push(`  -H 'Content-Type: application/json' \\`);
    lines.push(`  -d '${JSON.stringify(op.requestExample, null, 2)}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }
  return lines.join("\n");
}

function jsSample(op: Operation, key: string, projectId: string) {
  const url = SERVER + op.path.replace(/\{(\w+)\}/g, ":$1");
  const body =
    op.requestExample !== undefined
      ? `,\n  body: JSON.stringify(${JSON.stringify(op.requestExample, null, 2)})`
      : "";
  return `const res = await fetch("${url}", {
  method: "${op.method}",
  headers: {
    "Authorization": "Bearer ${key || "<your-admin-key>"}",
    "X-Project-Id": "${projectId || "<project-id>"}",
    "Content-Type": "application/json",
  }${body}
});
const data = await res.json();`;
}

function pythonSample(op: Operation, key: string, projectId: string) {
  const url = SERVER + op.path.replace(/\{(\w+)\}/g, ":$1");
  const body =
    op.requestExample !== undefined ? `, json=${JSON.stringify(op.requestExample, null, 2)}` : "";
  return `import requests

res = requests.${op.method.toLowerCase()}(
    "${url}",
    headers={
        "Authorization": "Bearer ${key || "<your-admin-key>"}",
        "X-Project-Id": "${projectId || "<project-id>"}",
    }${body}
)
data = res.json()`;
}

const LANG_LABEL: Record<Lang, string> = {
  curl: "cURL",
  js: "JavaScript",
  python: "Python",
};
const SHIKI_LANG: Record<Lang, string> = {
  curl: "bash",
  js: "javascript",
  python: "python",
};

const METHOD_TONE: Record<Method, string> = {
  GET: "se-method-get",
  POST: "se-method-post",
  PATCH: "se-method-patch",
  PUT: "se-method-patch",
  DELETE: "se-method-delete",
};

/* ───── Inline markdown ───── */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    if (m.index === undefined) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={`${keyPrefix}-b-${i++}`}>{tok.slice(2, -2)}</strong>);
    } else {
      out.push(<code key={`${keyPrefix}-c-${i++}`}>{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
function RenderDescription({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, idx) => {
        const useCaseMatch = p.match(/^\*\*Use case:\*\*\s*(.+)$/s);
        if (useCaseMatch) {
          return (
            <div key={`uc-${idx}`} className="se-api-usecase">
              <span className="se-api-usecase-tag">Use case</span>
              <span className="se-api-usecase-body">
                {renderInline(useCaseMatch[1], `uc${idx}`)}
              </span>
            </div>
          );
        }
        return <p key={`p-${idx}`}>{renderInline(p, `p${idx}`)}</p>;
      })}
    </>
  );
}

/* ───── Context ───── */
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
function useApi(): ApiCtx {
  const ctx = useContext(ApiContext);
  return ctx ?? { apiKey: "", setApiKey: () => {}, projectId: "", setProjectId: () => {} };
}

/* ───── Shiki highlighter (lazy, single instance) ───── */
type Highlighter = {
  codeToHtml: (code: string, opts: { lang: string; theme: string }) => string;
};
let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["github-dark-default"],
        langs: ["bash", "javascript", "python"],
      }),
    );
  }
  return highlighterPromise;
}
function HighlightedCode({ code, lang }: { code: string; lang: Lang }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((hl) => {
      if (cancelled) return;
      const out = hl.codeToHtml(code, { lang: SHIKI_LANG[lang], theme: "github-dark-default" });
      setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);
  if (html) {
    return (
      <div className="se-api-dialog-code se-shiki" dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
  return (
    <pre className="se-api-dialog-code">
      <code>{code}</code>
    </pre>
  );
}

/* ───── Code dialog ───── */
function CodeDialog({ op, onClose }: { op: Operation; onClose: () => void }) {
  const { apiKey, projectId } = useApi();
  const [lang, setLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    if (lang === "curl") return curlSample(op, apiKey, projectId);
    if (lang === "js") return jsSample(op, apiKey, projectId);
    return pythonSample(op, apiKey, projectId);
  }, [op, lang, apiKey, projectId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="se-api-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="se-api-dialog"
        role="dialog"
        aria-label={`Code samples for ${op.summary}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="se-api-dialog-head">
          <div className="se-api-dialog-title">
            <span className={`se-api-method ${METHOD_TONE[op.method]}`}>{op.method}</span>
            <code className="se-api-path">{op.path}</code>
          </div>
          <button
            type="button"
            className="se-api-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="se-api-dialog-tabs">
          {(["curl", "js", "python"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`se-api-tab ${l === lang ? "active" : ""}`}
              onClick={() => setLang(l)}
            >
              {LANG_LABEL[l]}
            </button>
          ))}
          <button type="button" className="se-api-dialog-copy" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <HighlightedCode code={code} lang={lang} />
      </div>
    </div>
  );
}

/* ───── Use cases table ───── */
function UseCaseRow({ useCase, onTry }: { useCase: UseCase; onTry: (value: unknown) => void }) {
  const [open, setOpen] = useState(false);
  const hasExample = useCase.exampleValue !== undefined;
  return (
    <>
      <tr>
        <td>
          <strong>{useCase.title}</strong>
        </td>
        <td>{renderInline(useCase.description, useCase.title)}</td>
        <td>
          {hasExample ? (
            <button
              type="button"
              className="se-api-uc-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? "Hide" : "Show"}
            </button>
          ) : (
            <span className="se-api-default">—</span>
          )}
        </td>
      </tr>
      {open && hasExample ? (
        <tr className="se-api-uc-example">
          <td colSpan={3}>
            <div className="se-api-uc-example-head">
              {useCase.exampleSummary ? (
                <p className="se-api-uc-summary">{useCase.exampleSummary}</p>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="se-api-uc-try"
                onClick={() => onTry(useCase.exampleValue)}
              >
                Try it
              </button>
            </div>
            <pre>
              <code>{JSON.stringify(useCase.exampleValue, null, 2)}</code>
            </pre>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function UseCasesTable({ cases, onTry }: { cases: UseCase[]; onTry: (value: unknown) => void }) {
  return (
    <div className="se-api-params se-api-usecases">
      <h4>Use cases</h4>
      <table>
        <thead>
          <tr>
            <th>Use case</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <UseCaseRow key={c.title} useCase={c} onTry={onTry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───── Body/response fields table ───── */
function FieldsTable({ title, fields }: { title: string; fields: BodyField[] }) {
  return (
    <div className="se-api-params">
      <h4>{title}</h4>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name}>
              <td>
                <code>{f.name}</code>
                {f.required ? <span className="req">required</span> : null}
              </td>
              <td>
                <code>{f.type}</code>
              </td>
              <td>
                {f.description ?? "—"}
                {f.defaultValue !== undefined ? (
                  <>
                    {" "}
                    <span className="se-api-default">
                      default: <code>{JSON.stringify(f.defaultValue)}</code>
                    </span>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───── Operation block ───── */
function OperationBlock({ op }: { op: Operation }) {
  const { apiKey, projectId } = useApi();
  const [codeOpen, setCodeOpen] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);
  const [tryBody, setTryBody] = useState<string>(
    op.requestExample ? JSON.stringify(op.requestExample, null, 2) : "",
  );
  const [tryPath, setTryPath] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [pending, setPending] = useState(false);
  const tryRef = useRef<HTMLDivElement | null>(null);

  function tryFromExample(value: unknown) {
    setTryBody(typeof value === "string" ? value : JSON.stringify(value, null, 2));
    setTryOpen(true);
    requestAnimationFrame(() => {
      tryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function invoke() {
    setPending(true);
    setResponse(null);
    let url = SERVER + op.path;
    for (const [k, v] of Object.entries(tryPath)) {
      url = url.replace(`{${k}}`, encodeURIComponent(v));
    }
    try {
      const res = await fetch(url, {
        method: op.method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Project-Id": projectId,
          "Content-Type": "application/json",
        },
        body: op.requestExample !== undefined && tryBody.trim() ? tryBody : undefined,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* not JSON */
      }
      setResponse({ status: res.status, body: pretty });
    } catch (err) {
      setResponse({
        status: 0,
        body: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPending(false);
    }
  }

  const pathParams = op.parameters.filter((p) => p.in === "path");

  return (
    <section className="se-api-op" id={op.operationId}>
      <header className="se-api-op-head">
        <div className="se-api-op-head-row">
          <span className={`se-api-method ${METHOD_TONE[op.method]}`}>{op.method}</span>
          <code className="se-api-path">{op.path}</code>
          <button
            type="button"
            className="se-api-code-btn"
            onClick={() => setCodeOpen(true)}
            aria-label="Show code samples"
            title="Show code samples"
          >
            <span aria-hidden>{"</>"}</span>
            <span>Code</span>
          </button>
        </div>
        <h3 className="se-api-summary">{op.summary}</h3>
      </header>

      {op.description ? (
        <div className="se-api-desc">
          <RenderDescription text={op.description} />
        </div>
      ) : null}

      {op.useCases.length > 0 ? <UseCasesTable cases={op.useCases} onTry={tryFromExample} /> : null}

      {op.parameters.length > 0 ? (
        <div className="se-api-params">
          <h4>Parameters</h4>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>In</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {op.parameters.map((p) => (
                <tr key={`${p.in}-${p.name}`}>
                  <td>
                    <code>{p.name}</code>
                    {p.required ? <span className="req">required</span> : null}
                  </td>
                  <td>{p.in}</td>
                  <td>{p.schema?.type ?? "string"}</td>
                  <td>{p.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {op.bodyFields.length > 0 ? <FieldsTable title="Body" fields={op.bodyFields} /> : null}

      {op.responseFields.length > 0 ? (
        <FieldsTable title={`Response · ${op.responseStatus}`} fields={op.responseFields} />
      ) : null}

      {op.responseExample !== undefined ? (
        <div className="se-api-response">
          <div className="se-api-response-head">
            Example · <code>{op.responseStatus}</code>
          </div>
          <pre>
            <code>{JSON.stringify(op.responseExample, null, 2)}</code>
          </pre>
        </div>
      ) : null}

      <div className="se-api-try" ref={tryRef}>
        <button type="button" className="se-api-try-toggle" onClick={() => setTryOpen((v) => !v)}>
          {tryOpen ? "Hide try-it" : "▶ Try it"}
        </button>
        {tryOpen ? (
          <div className="se-api-try-body">
            {!apiKey ? (
              <div className="se-api-try-warn">
                Add your admin API key in the side panel to enable live calls.
              </div>
            ) : null}
            {pathParams.length > 0 ? (
              <div className="se-api-try-fields">
                {pathParams.map((p) => (
                  <label key={p.name} className="se-api-try-field">
                    <span>
                      <code>{p.name}</code> · path
                    </span>
                    <input
                      type="text"
                      value={tryPath[p.name] ?? ""}
                      onChange={(e) =>
                        setTryPath((prev) => ({ ...prev, [p.name]: e.target.value }))
                      }
                      placeholder={p.description ?? p.name}
                    />
                  </label>
                ))}
              </div>
            ) : null}
            {op.requestExample !== undefined ? (
              <label className="se-api-try-body-field">
                <span>Body · JSON</span>
                <textarea
                  rows={8}
                  value={tryBody}
                  onChange={(e) => setTryBody(e.target.value)}
                  spellCheck={false}
                />
              </label>
            ) : null}
            <button
              type="button"
              className="se-api-try-go"
              onClick={invoke}
              disabled={pending || !apiKey || !projectId}
            >
              {pending ? "Sending…" : `Send ${op.method}`}
            </button>
            {response ? (
              <div className="se-api-try-result" data-ok={response.status < 400 ? "true" : "false"}>
                <div className="se-api-try-result-head">
                  Status: <code>{response.status}</code>
                </div>
                <pre>
                  <code>{response.body}</code>
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {codeOpen ? <CodeDialog op={op} onClose={() => setCodeOpen(false)} /> : null}
    </section>
  );
}

/* ───── Active-section tracking via IntersectionObserver ───── */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || ids.length === 0) return;
    const visible = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible.set(e.target.id, e.intersectionRatio);
          } else {
            visible.delete(e.target.id);
          }
        }
        // Pick the entry highest in the viewport (smallest top offset).
        let bestId: string | null = null;
        let bestTop = Infinity;
        for (const id of visible.keys()) {
          const el = document.getElementById(id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top < bestTop && top > -el.offsetHeight) {
            bestTop = top;
            bestId = id;
          }
        }
        if (bestId) setActive(bestId);
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

/* ───── Sidebar (renders in fumadocs TOC slot) ───── */
export function ApiSidebar() {
  const { apiKey, setApiKey, projectId, setProjectId } = useApi();
  const allIds = useMemo(() => ALL_OPS.map((op) => op.operationId), []);
  const active = useActiveSection(allIds);

  // Two-level grouping: by tag (= section, e.g. "Gates"), then by path inside
  // each tag. Methods listed under each path. Mirrors the body order so anchor
  // jumps land on the matching <section id> in the page.
  const groupedByTag = useMemo(() => {
    const order: Method[] = ["GET", "POST", "PATCH", "PUT", "DELETE"];
    const tagMap = new Map<string, Map<string, Operation[]>>();
    for (const op of ALL_OPS) {
      let pathMap = tagMap.get(op.tag);
      if (!pathMap) {
        pathMap = new Map();
        tagMap.set(op.tag, pathMap);
      }
      const arr = pathMap.get(op.path) ?? [];
      arr.push(op);
      pathMap.set(op.path, arr);
    }
    for (const pathMap of tagMap.values()) {
      for (const arr of pathMap.values()) {
        arr.sort((a, b) => order.indexOf(a.method) - order.indexOf(b.method));
      }
    }
    return Array.from(tagMap.entries()).map(
      ([tag, pathMap]) => [tag, Array.from(pathMap.entries())] as const,
    );
  }, []);

  return (
    <aside className="se-api-side sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] flex flex-col [grid-area:toc] w-(--fd-toc-width) pt-12 pe-4 pb-2 max-xl:hidden">
      <div className="se-api-side-card">
        <h4>Try it</h4>
        <p>Provide your credentials to enable live calls. Stored only in this tab.</p>
        <label>
          <span>Admin API key</span>
          <input
            type="password"
            value={apiKey}
            placeholder="sdk_admin_…"
            onChange={(e) => setApiKey(e.target.value)}
            spellCheck={false}
          />
        </label>
        <label>
          <span>Project ID</span>
          <input
            type="text"
            value={projectId}
            placeholder="prj_…"
            onChange={(e) => setProjectId(e.target.value)}
            spellCheck={false}
          />
        </label>
        <p className="se-api-side-warn">
          Calls go directly from your browser to the ShipEasy API. Your key is never sent to our
          docs server.
        </p>
      </div>
      <nav className="se-api-side-nav">
        {groupedByTag.map(([tag, paths]) => (
          <section key={tag} className="se-api-side-section">
            <a href={`#section-${tag.toLowerCase()}`} className="se-api-side-section-h">
              {tag}
            </a>
            {paths.map(([path, list]) => (
              <div key={path} className="se-api-side-endpoint">
                <div className="se-api-side-endpoint-path">
                  <code>{path}</code>
                </div>
                <ul>
                  {list.map((op) => (
                    <li key={op.operationId}>
                      <a
                        href={`#${op.operationId}`}
                        className={op.operationId === active ? "active" : ""}
                        aria-current={op.operationId === active ? "true" : undefined}
                      >
                        <span className={`se-method-pill ${METHOD_TONE[op.method]}`}>
                          {op.method}
                        </span>
                        <span className="label">{op.summary}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </nav>
    </aside>
  );
}

/* ───── Main list (renders in page body) ───── */
export function ApiList(): ReactNode {
  const grouped = useMemo(() => {
    const m = new Map<string, Operation[]>();
    for (const op of ALL_OPS) {
      const arr = m.get(op.tag) ?? [];
      arr.push(op);
      m.set(op.tag, arr);
    }
    return Array.from(m.entries());
  }, []);

  return (
    <div className="se-api-main not-prose">
      {grouped.map(([tag, ops]) => (
        <div key={tag} className="se-api-group">
          <h2 id={`section-${tag.toLowerCase()}`} className="se-api-group-h">
            {tag}
          </h2>
          {ops.map((op) => (
            <OperationBlock key={op.operationId} op={op} />
          ))}
        </div>
      ))}
    </div>
  );
}
