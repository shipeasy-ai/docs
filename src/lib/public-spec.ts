/**
 * The PUBLIC view of the admin OpenAPI spec.
 *
 * The published `@shipeasy/openapi` spec describes the whole admin surface,
 * including products we do not market: experiments (A/B tests, holdouts, SRM
 * and sequential-testing guards, ship/hold verdicts), universes and i18n. The
 * CLI, the MCP server and every SDK admin client still need those operations,
 * so the spec itself stays whole — this module narrows it for docs.shipeasy.ai.
 *
 * Both consumers go through here so the generated MDX and the runtime
 * `<APIPage>` always agree:
 *
 *   scripts/gen-api-reference.ts   decides which pages/meta entries exist
 *   src/lib/openapi.ts             decides what each page renders
 *
 * What it removes, wherever it appears in the document:
 *   - operations and tags for hidden products (by path, operationId and tag)
 *   - properties whose name is experiment vocabulary (holdoutGate, verdict,
 *     sequentialTesting, srmThreshold, allocationPct, cupedBaselineDays, …)
 *   - enum members that name a hidden concept (experiment_srm, holdout, …)
 *   - sentences in descriptions that talk about experiments
 *
 * What it rewrites: `info.description` (it told readers every request needs an
 * `X-Project-Id` header, which is wrong — the key carries the project).
 *
 * Un-hiding a product: delete its entry from the patterns below.
 */

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

/** Operation paths / ids / tag names that are not published. */
export const HIDDEN_OPERATION = /i18n|experiment|universe/i;

/** Property names that only mean something to a hidden product. */
const HIDDEN_PROPERTY =
  /experiment|holdout|^srm|verdict|sequential|significance|cuped|msprt|allocation|universe|peekWarning|minEffect|min_effect|^statMethod$|^sigThreshold$|^autoRollback$|^minSample|^minRuntimeDays$|^defaultPower$|^ciConfidence$|^defaultMei$/i;

/** Enum members that name a hidden concept. */
const HIDDEN_ENUM_MEMBER = /experiment|holdout|srm|peek/i;

/** A description sentence/line that talks about a hidden concept. */
const HIDDEN_TEXT =
  /experiment|a\/b|holdout|\bsrm\b|sequential test|universe|significance|verdict/i;

const INFO_DESCRIPTION = [
  "REST API for managing feature flags, dynamic configs, kill switches, metrics, alert rules and the ops queue in a Shipeasy project.",
  "",
  "Authenticate with an admin key: `Authorization: Bearer sdk_admin_…`. The key carries its project, so no other header is needed; send `X-Project-Id` only to act on a different project the key's owner can administer.",
  "",
  'Mint admin keys via `POST /api/admin/keys` with `type: "admin"`. Keys expire after 90 days; rotate with the `revoke` action.',
].join("\n");

/** Fixed rewrites applied before the generic sentence filter, so a sentence
 *  that is mostly about something else keeps its useful half. */
const PHRASE_REWRITES: [RegExp, string][] = [
  [/\bgates\/experiments\b/gi, "gates"],
  [/\bgate\/experiment\b/gi, "gate"],
  [/\bflags\/experiments\b/gi, "flags"],
  [/\bflag\/experiment\b/gi, "flag"],
  [/,\s*experiment-analysis knobs \([^)]*\),/gi, ","],
  [
    /toggle a module on\/off, or tune the experiment-analysis defaults without leaving the CLI/gi,
    "or toggle a module on/off without leaving the CLI",
  ],
  [/in an experiment or alert rule/gi, "in an alert rule"],
  [/to attach as an experiment's success metric/gi, "to reference from an alert rule"],
  [/once no running experiment depends on it/gi, "once nothing uses it any more"],
  [/,\s*A\/B\/?n? experiments,/gi, ","],
  [/,\s*experiments,/gi, ","],
  [/\bgates, experiments, /gi, "gates, "],
  [/\bfeature gates, experiments, /gi, "feature gates, "],
  [/ or experiment\b/gi, ""],
  [/, experiment(?:s)? and /gi, " and "],
  [/\s*\(e\.g\. sequential testing[^)]*\)/gi, ""],
  [/\s*\(e\.g\. editing allocation while running\)/gi, ""],
  [/\(universe, metric, gate, event\)/gi, "(metric, gate, event)"],
  [/maximum experiments, metrics, or configs/gi, "maximum metrics or configs"],
];

/** Phrase rewrites only — for strings that are data (error messages, example
 *  values), where dropping a sentence would leave nothing behind. */
function rewriteText(text: string): string {
  let out = text;
  for (const [re, rep] of PHRASE_REWRITES) out = out.replace(re, rep);
  return out;
}

/** Map keys that belong to a hidden product but do not match the property
 *  pattern (an error code, an example name). */
const HIDDEN_KEY = /^GROUPS_WEIGHT_SUM$/;

function scrubText(text: string): string {
  let out = text;
  for (const [re, rep] of PHRASE_REWRITES) out = out.replace(re, rep);
  const kept: string[] = [];
  for (const line of out.split("\n")) {
    if (!HIDDEN_TEXT.test(line)) {
      kept.push(line);
      continue;
    }
    // A list item or a standalone heading line goes whole; prose is split into
    // sentences so a paragraph that mentions the term once keeps the rest.
    if (/^\s*(?:[-*]|\d+\.)\s/.test(line)) continue;
    const parts = line.split(/(?<=[.!?])\s+/).filter((s) => !HIDDEN_TEXT.test(s));
    if (parts.length) kept.push(parts.join(" "));
  }
  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isHiddenOperationNode(path: string, op: Obj): boolean {
  if (HIDDEN_OPERATION.test(path)) return true;
  const id = typeof op.operationId === "string" ? op.operationId : "";
  if (HIDDEN_OPERATION.test(id)) return true;
  const tags = Array.isArray(op.tags) ? op.tags : [];
  return tags.some((t) => typeof t === "string" && HIDDEN_OPERATION.test(t));
}

/** An array element that is itself a hidden-product record (a search hit of
 *  type experiment, an example universe). */
function isHiddenItem(n: Json): boolean {
  return (
    !!n &&
    typeof n === "object" &&
    !Array.isArray(n) &&
    (n.type === "experiment" || n.type === "universe")
  );
}

function clean(node: Json, key?: string): Json {
  if (Array.isArray(node)) {
    // An enum loses its hidden members; every other array is walked as-is.
    if (key === "enum") {
      return node.filter((m) => !(typeof m === "string" && HIDDEN_ENUM_MEMBER.test(m)));
    }
    return node.filter((n) => !isHiddenItem(n)).map((n) => clean(n));
  }
  if (node && typeof node === "object") {
    const out: Obj = {};
    const removed = new Set<string>();
    for (const [k, v] of Object.entries(node)) {
      if (k === "properties" && v && typeof v === "object" && !Array.isArray(v)) {
        const props: Obj = {};
        for (const [pk, pv] of Object.entries(v)) {
          if (HIDDEN_PROPERTY.test(pk)) {
            removed.add(pk);
            continue;
          }
          // A gate's `type` enum is `targeting | holdout`; with the holdout
          // member gone it is a one-value field that says nothing.
          if (
            pk === "type" &&
            pv &&
            typeof pv === "object" &&
            !Array.isArray(pv) &&
            Array.isArray(pv.enum) &&
            pv.enum.some((m) => typeof m === "string" && /holdout/i.test(m))
          ) {
            removed.add(pk);
            continue;
          }
          props[pk] = clean(pv, pk);
        }
        out[k] = props;
        continue;
      }
      if (k === "description" || k === "summary") {
        out[k] = typeof v === "string" ? scrubText(v) : v;
        continue;
      }
      // A key named for a hidden product (an `EXPERIMENT_*` error code, an
      // example's `moduleExperiments`) goes with it.
      if (HIDDEN_PROPERTY.test(k) || HIDDEN_KEY.test(k)) {
        removed.add(k);
        continue;
      }
      out[k] = typeof v === "string" ? rewriteText(v) : clean(v, k);
    }
    // An example whose only content was a hidden field is now `{}` — drop it
    // rather than publish an empty sample.
    if (key === "examples") {
      for (const [ek, ev] of Object.entries(out)) {
        const val = (ev as Obj | undefined)?.value;
        if (val && typeof val === "object" && !Array.isArray(val) && !Object.keys(val).length) {
          delete out[ek];
        }
      }
    }
    // Keep `required` honest about the fields we just took out.
    if (removed.size && Array.isArray(out.required)) {
      out.required = out.required.filter((r) => !(typeof r === "string" && removed.has(r)));
    }
    return out;
  }
  return node;
}

export function publicSpec<T extends object>(raw: T): T {
  const spec = clean(raw as unknown as Json) as Obj;

  const paths = (spec.paths ?? {}) as Obj;
  for (const [path, item] of Object.entries(paths)) {
    if (HIDDEN_OPERATION.test(path)) {
      delete paths[path];
      continue;
    }
    if (item && typeof item === "object" && !Array.isArray(item)) {
      for (const [method, op] of Object.entries(item)) {
        if (op && typeof op === "object" && !Array.isArray(op) && isHiddenOperationNode(path, op)) {
          delete (item as Obj)[method];
        }
      }
      if (!Object.keys(item).some((m) => /^(get|put|post|patch|delete)$/.test(m))) {
        delete paths[path];
      }
    }
  }

  const schemas = ((spec.components as Obj | undefined)?.schemas ?? {}) as Obj;
  for (const name of Object.keys(schemas)) {
    if (HIDDEN_OPERATION.test(name)) delete schemas[name];
  }

  if (Array.isArray(spec.tags)) {
    spec.tags = spec.tags.filter(
      (t) =>
        !(
          t &&
          typeof t === "object" &&
          (HIDDEN_OPERATION.test(String((t as Obj).name)) ||
            HIDDEN_OPERATION.test(String((t as Obj).parent ?? "")))
        ),
    );
  }

  const info = (spec.info ?? {}) as Obj;
  info.description = INFO_DESCRIPTION;
  spec.info = info;

  return spec as unknown as T;
}
