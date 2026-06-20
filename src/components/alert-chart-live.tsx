"use client";

/**
 * AlertChartLive — the app's interactive alert chart, embedded in the docs.
 *
 * Unlike the static `doc-scenes` illustrations this one is the real thing:
 * Recharts under the hood, with the togglable views (Area · Line · Bars, bucket
 * size, threshold/avg overlays) and the hover ticket card from the dashboard.
 * It's fully self-contained — inline styles on the `--se-*` tokens the docs
 * theme already defines, deterministic baked data (no network, no RNG, a fixed
 * "now" so SSR and hydration agree), keyed off a `feature` prop so each instance
 * tells a different part of the alert story.
 */

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// ── tokens / types ────────────────────────────────────────────────────────────

type Severity = "danger" | "warn" | "info";
type Comparator = "gt" | "gte" | "lt" | "lte";
type Feature = "breach" | "window" | "floor";
type Style = "area" | "line" | "bars";
type Bucket = "1h" | "6h" | "1d";

const HOUR = 3_600_000;
const DAY = 86_400_000;
// Fixed reference "now" so server + client render identical bands (deterministic).
const NOW = Date.UTC(2026, 5, 15, 12, 0, 0);

const SEV: Record<Severity, string> = {
  danger: "var(--se-danger)",
  warn: "var(--se-warn)",
  info: "var(--se-info)",
};
const CMP: Record<Comparator, string> = { gt: ">", gte: "≥", lt: "<", lte: "≤" };
const BUCKET_MS: Record<Bucket, number> = { "1h": HOUR, "6h": 6 * HOUR, "1d": DAY };
const Y_AXIS_W = 44;

type Pt = { t: number; v: number };
type Violation = {
  id: string;
  number: number;
  title: string;
  severity: Severity;
  startT: number;
  endT: number | null;
  observedValue: number;
};

// ── scene configs ─────────────────────────────────────────────────────────────

const NOISE = [
  0.18, -0.42, 0.62, -0.28, 0.35, -0.55, 0.12, 0.48, -0.22, 0.58, -0.38, 0.3, -0.15, 0.5, -0.62,
  0.24, -0.34, 0.44, -0.5, 0.16, 0.4, -0.26, 0.54, -0.6, 0.28,
];

type Cfg = {
  metric: string;
  rule: string;
  comparator: Comparator;
  threshold: number;
  severity: Severity;
  windowHours: number;
  baseline: number;
  incidents: { dayAgo: number; spreadH: number; delta: number; title: string }[];
};

const CONFIGS: Record<Feature, Cfg> = {
  breach: {
    metric: "checkout_errors",
    rule: "Checkout errors spiking",
    comparator: "gt",
    threshold: 50,
    severity: "danger",
    windowHours: 2,
    baseline: 12,
    incidents: [
      { dayAgo: 10.5, spreadH: 9, delta: 62, title: "Errors spiked after deploy v4.2.0" },
      { dayAgo: 4.4, spreadH: 8, delta: 48, title: "Second spike — payments provider 5xx" },
    ],
  },
  window: {
    metric: "p95_latency_ms",
    rule: "p95 latency over budget",
    comparator: "gt",
    threshold: 420,
    severity: "warn",
    windowHours: 12,
    baseline: 240,
    incidents: [
      { dayAgo: 10, spreadH: 4, delta: 360, title: "Brief blip — one slow node, recovered" },
      { dayAgo: 3.4, spreadH: 17, delta: 235, title: "Sustained regression — N+1 in feed query" },
    ],
  },
  floor: {
    metric: "signups_per_hour",
    rule: "Signups below floor",
    comparator: "lt",
    threshold: 12,
    severity: "info",
    windowHours: 24,
    baseline: 28,
    incidents: [
      { dayAgo: 6, spreadH: 30, delta: -24, title: "Signups dried up — checkout 500ing" },
    ],
  },
};

// ── data ──────────────────────────────────────────────────────────────────────

function trailingWindowAvg(series: Pt[], windowHours: number): Pt[] {
  const win = windowHours * HOUR;
  let lo = 0;
  let sum = 0;
  const out: Pt[] = [];
  for (let hi = 0; hi < series.length; hi++) {
    sum += series[hi].v;
    while (series[hi].t - series[lo].t > win) {
      sum -= series[lo].v;
      lo++;
    }
    out.push({ t: series[hi].t, v: sum / (hi - lo + 1) });
  }
  return out;
}

function bucketSeries(series: Pt[], bucketMs: number): Pt[] {
  if (bucketMs <= HOUR) return series;
  const bins = new Map<number, { sum: number; n: number }>();
  for (const p of series) {
    const key = Math.floor(p.t / bucketMs) * bucketMs;
    const cur = bins.get(key) ?? { sum: 0, n: 0 };
    cur.sum += p.v;
    cur.n += 1;
    bins.set(key, cur);
  }
  return [...bins.entries()].sort((a, b) => a[0] - b[0]).map(([t, b]) => ({ t, v: b.sum / b.n }));
}

function buildScene(cfg: Cfg) {
  const t0 = NOW - 14 * DAY;
  const N = 14 * 24;
  const series: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const t = t0 + i * HOUR;
    let v =
      cfg.baseline +
      0.08 * cfg.baseline * Math.sin(i * 0.26) +
      0.05 * cfg.baseline * NOISE[i % NOISE.length];
    for (const inc of cfg.incidents) {
      const center = NOW - inc.dayAgo * DAY;
      const sigma = inc.spreadH * HOUR;
      v += inc.delta * Math.exp(-(((t - center) / sigma) ** 2));
    }
    series.push({ t, v: Math.max(0, Math.round(v * 100) / 100) });
  }

  const avg = trailingWindowAvg(series, cfg.windowHours);
  const above = cfg.comparator === "gt" || cfg.comparator === "gte";
  const breaching = (x: number) => (above ? x >= cfg.threshold : x <= cfg.threshold);
  const violations: Violation[] = [];
  let start = -1;
  let extreme = 0;
  for (let i = 0; i < avg.length; i++) {
    const b = breaching(avg[i].v);
    if (b && start < 0) {
      start = avg[i].t;
      extreme = avg[i].v;
    } else if (b) {
      extreme = above ? Math.max(extreme, avg[i].v) : Math.min(extreme, avg[i].v);
    }
    if ((!b || i === avg.length - 1) && start >= 0) {
      const inc = cfg.incidents.find((x) => Math.abs(NOW - x.dayAgo * DAY - start) < 1.5 * DAY);
      violations.push({
        id: `${cfg.metric}-${violations.length + 1}`,
        number: 1400 + violations.length + 1,
        title: inc?.title ?? `${cfg.metric} crossed its threshold`,
        severity: cfg.severity,
        startT: start,
        endT: avg[i].t,
        observedValue: Math.round(extreme * 100) / 100,
      });
      start = -1;
    }
  }
  return { series, t0, t1: NOW, violations };
}

// ── formatting ────────────────────────────────────────────────────────────────

function fmtTick(n: number): string {
  if (Math.abs(n) >= 1000) return `${Math.round(n / 100) / 10}k`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(Math.abs(n) < 10 ? 1 : 0);
}
function fmtDay(t: number): string {
  const d = Math.round((NOW - t) / DAY);
  return d <= 0 ? "now" : `−${d}d`;
}
function fmtAgo(t: number): string {
  const h = Math.round((NOW - t) / HOUR);
  if (h < 1) return "just now";
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function fmtDur(ms: number): string {
  const h = Math.round(ms / HOUR);
  if (h < 1) return "<1h";
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

// ── small UI atoms (inline-styled, no Tailwind in docs) ────────────────────────

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: 8,
        border: "1px solid var(--se-line)",
        background: "var(--se-bg-2)",
      }}
    >
      {options.map((o) => {
        const on = o.v === value;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              fontFamily: "var(--se-mono)",
              fontSize: 11,
              padding: "3px 9px",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              color: on ? "var(--se-fg)" : "var(--se-fg-3)",
              background: on ? "var(--se-bg-4)" : "transparent",
              boxShadow: on ? "inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
              transition: "color .12s, background .12s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiToggle({
  options,
  value,
  onToggle,
}: {
  options: { v: string; label: string }[];
  value: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: 8,
        border: "1px solid var(--se-line)",
        background: "var(--se-bg-2)",
      }}
    >
      {options.map((o) => {
        const on = value.includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onToggle(o.v)}
            style={{
              fontFamily: "var(--se-mono)",
              fontSize: 11,
              padding: "3px 9px",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              color: on ? "var(--se-fg)" : "var(--se-fg-3)",
              background: on ? "var(--se-bg-4)" : "transparent",
              transition: "color .12s, background .12s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--se-mono)",
        fontSize: 9.5,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "2px 6px",
        borderRadius: 4,
        color: tone,
        background: `color-mix(in oklab, ${tone} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${tone} 35%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

// Recharts hands a horizontal ReferenceLine label the plot-left `x` + pixel `y`;
// draw the threshold value as a coloured pill in the axis gutter.
function ThresholdTick({
  viewBox,
  text,
  color,
}: {
  viewBox?: { x?: number; y?: number };
  text: string;
  color: string;
}) {
  const x = viewBox?.x;
  const y = viewBox?.y;
  if (x == null || y == null) return null;
  const w = Y_AXIS_W - 4;
  return (
    <g>
      <rect
        x={x - w - 1}
        y={y - 7.5}
        width={w}
        height={15}
        rx={3}
        fill="var(--se-bg-1)"
        stroke={color}
        strokeOpacity={0.55}
      />
      <text
        x={x - w / 2 - 1}
        y={y + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--se-mono)"
        fontSize={9.5}
        fontWeight={500}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
}

// ── the chart ─────────────────────────────────────────────────────────────────

export function AlertChartLive({ feature = "breach" }: { feature?: Feature }) {
  const cfg = CONFIGS[feature];
  const color = SEV[cfg.severity];
  const [style, setStyle] = useState<Style>("area");
  const [bucket, setBucket] = useState<Bucket>("1h");
  const [overlays, setOverlays] = useState<string[]>(["threshold", "avg"]);
  const [hover, setHover] = useState<string | null>(null);
  const showThreshold = overlays.includes("threshold");
  const showAvg = overlays.includes("avg");

  const { series, violations } = useMemo(() => buildScene(cfg), [cfg]);
  const { display, t0, t1, yMax } = useMemo(() => {
    const lo = series[0].t;
    const hi = series[series.length - 1].t;
    const avg = trailingWindowAvg(series, cfg.windowHours);
    const avgByT = new Map(avg.map((p) => [p.t, p.v]));
    const v = bucketSeries(series, BUCKET_MS[bucket]);
    const a = bucketSeries(avg, BUCKET_MS[bucket]);
    const aByT = new Map(a.map((p) => [p.t, p.v]));
    const pts = v.map((p) => ({
      t: p.t,
      v: Math.round(p.v * 10) / 10,
      avg: Math.round((aByT.get(p.t) ?? avgByT.get(p.t) ?? p.v) * 10) / 10,
    }));
    const peak = Math.max(cfg.threshold, ...pts.map((p) => Math.max(p.v, p.avg)));
    return { display: pts, t0: lo, t1: hi, yMax: Math.ceil((peak * 1.18) / 5) * 5 };
  }, [series, cfg.windowHours, cfg.threshold, bucket]);

  const span = Math.max(1, t1 - t0);
  const firingMs = violations.reduce((s, v) => s + ((v.endT ?? NOW) - v.startT), 0);
  const mono = (size: number, c = "var(--se-fg-3)") =>
    ({ fontFamily: "var(--se-mono)", fontSize: size, color: c }) as const;

  return (
    <div
      className="not-prose"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        margin: "26px 0",
        padding: 16,
        borderRadius: 14,
        border: "1px solid var(--se-line-2)",
        background: "var(--se-bg-1)",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: color }} />
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--se-fg)" }}>
              {cfg.rule}
            </span>
            <Badge tone={violations.length ? color : "var(--se-fg-3)"}>
              {violations.length ? "raised" : "ok"}
            </Badge>
          </div>
          <div style={{ ...mono(11.5), marginTop: 2 }}>
            {cfg.metric} · {CMP[cfg.comparator]} {cfg.threshold} over {cfg.windowHours}h · last 14
            days
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, textAlign: "right" }}>
          <Stat value={violations.length} label="violations" />
          <Stat value={fmtDur(firingMs)} label="time firing" tone={color} />
        </div>
      </div>

      {/* toggles */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <Toggle
          value={style}
          onChange={setStyle}
          options={[
            { v: "area", label: "Area" },
            { v: "line", label: "Line" },
            { v: "bars", label: "Bars" },
          ]}
        />
        <Toggle
          value={bucket}
          onChange={setBucket}
          options={[
            { v: "1h", label: "1h" },
            { v: "6h", label: "6h" },
            { v: "1d", label: "1d" },
          ]}
        />
        <div style={{ marginLeft: "auto" }}>
          <MultiToggle
            value={overlays}
            onToggle={(v) =>
              setOverlays((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))
            }
            options={[
              { v: "threshold", label: "Threshold" },
              { v: "avg", label: "Window avg" },
            ]}
          />
        </div>
      </div>

      {/* chart + hover overlay */}
      <div style={{ position: "relative", width: "100%" }}>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={display} margin={{ top: 14, right: 6, bottom: 6, left: 0 }}>
              <defs>
                <linearGradient id={`acFill-${feature}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--se-fg-3)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--se-fg-3)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 3" stroke="var(--se-line)" />
              <XAxis dataKey="t" type="number" domain={[t0, t1]} scale="time" hide />
              <YAxis
                domain={[0, yMax]}
                width={Y_AXIS_W}
                tickCount={6}
                tickLine={false}
                axisLine={{ stroke: "var(--se-line)" }}
                tickFormatter={fmtTick}
                tick={{ fill: "var(--se-fg-4)", fontSize: 9.5, fontFamily: "var(--se-mono)" }}
              />

              {violations.map((v) => (
                <ReferenceArea
                  key={`band-${v.id}`}
                  x1={v.startT}
                  x2={v.endT ?? t1}
                  fill={SEV[v.severity]}
                  fillOpacity={0.1}
                  stroke="none"
                  ifOverflow="hidden"
                />
              ))}

              {showThreshold ? (
                <ReferenceLine
                  y={cfg.threshold}
                  stroke={color}
                  strokeDasharray="4 3"
                  strokeOpacity={0.85}
                  label={(p: { viewBox?: { x?: number; y?: number } }) => (
                    <ThresholdTick
                      viewBox={p.viewBox}
                      text={`${CMP[cfg.comparator]}${cfg.threshold}`}
                      color={color}
                    />
                  )}
                />
              ) : null}

              {style === "bars" ? (
                <Bar
                  dataKey="v"
                  fill="var(--se-fg-4)"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              ) : style === "line" ? (
                <Line
                  dataKey="v"
                  type="monotone"
                  stroke="var(--se-fg-3)"
                  strokeWidth={1.4}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : (
                <Area
                  dataKey="v"
                  type="monotone"
                  stroke="var(--se-fg-3)"
                  strokeWidth={1.2}
                  fill={`url(#acFill-${feature})`}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {showAvg ? (
                <Line
                  dataKey="avg"
                  type="monotone"
                  stroke="var(--se-fg)"
                  strokeWidth={1.9}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null}

              {violations.map((v) => (
                <ReferenceLine
                  key={`fire-${v.id}`}
                  x={v.startT}
                  stroke={SEV[v.severity]}
                  strokeWidth={1}
                  strokeDasharray="3 2"
                  ifOverflow="hidden"
                />
              ))}
              {showAvg
                ? violations.map((v) => (
                    <ReferenceDot
                      key={`dot-${v.id}`}
                      x={v.startT}
                      y={v.observedValue}
                      r={3.2}
                      fill={SEV[v.severity]}
                      stroke="var(--se-bg-1)"
                      strokeWidth={1.5}
                      ifOverflow="extendDomain"
                    />
                  ))
                : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* hover layer — one band per violation, mapped by time to the plot */}
        <div
          style={{ position: "absolute", top: 14, bottom: 6, left: Y_AXIS_W, right: 6 }}
          // overlay itself ignores pointer events; the bands re-enable them
          aria-hidden
        >
          {violations.map((v) => {
            const left = ((v.startT - t0) / span) * 100;
            const width = (((v.endT ?? t1) - v.startT) / span) * 100;
            const on = hover === v.id;
            const vColor = SEV[v.severity];
            const ongoing = v.endT == null;
            return (
              <div
                key={`hover-${v.id}`}
                onMouseEnter={() => setHover(v.id)}
                onMouseLeave={() => setHover((h) => (h === v.id ? null : h))}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${left}%`,
                  width: `${Math.max(width, 0.6)}%`,
                  cursor: "help",
                  pointerEvents: "auto",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `color-mix(in oklab, ${vColor} ${on ? 18 : 8}%, transparent)`,
                    borderLeft: `1px solid color-mix(in oklab, ${vColor} 45%, transparent)`,
                    borderRight: `1px solid color-mix(in oklab, ${vColor} 45%, transparent)`,
                    transition: "background .12s",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: -7,
                    left: 0,
                    width: 7,
                    height: 7,
                    transform: "translateX(-50%)",
                    borderRadius: 999,
                    background: vColor,
                    boxShadow: "0 0 0 2px var(--se-bg-1)",
                  }}
                />
                {on ? (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 250,
                      maxWidth: "80vw",
                      zIndex: 5,
                      padding: 12,
                      borderRadius: 10,
                      background: "var(--se-bg-2)",
                      border: "1px solid var(--se-line-2)",
                      boxShadow: "0 14px 32px -10px rgba(0,0,0,0.55)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{ width: 7, height: 7, borderRadius: 999, background: vColor }}
                      />
                      <span style={mono(11)}>Alert #{v.number}</span>
                      <span style={{ marginLeft: "auto" }}>
                        <Badge tone={ongoing ? "var(--se-danger)" : vColor}>
                          {ongoing ? "firing" : "resolved"}
                        </Badge>
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "var(--se-fg)",
                        lineHeight: 1.35,
                      }}
                    >
                      {v.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        borderTop: "1px solid var(--se-line)",
                        paddingTop: 8,
                        ...mono(11),
                      }}
                    >
                      <Row k="Observed">
                        <span style={{ color: vColor }}>{v.observedValue}</span>
                        <span style={{ color: "var(--se-fg-4)" }}>
                          {" "}
                          ({CMP[cfg.comparator]} {cfg.threshold})
                        </span>
                      </Row>
                      <Row k="Window">{cfg.windowHours}h avg</Row>
                      <Row k="Fired">{fmtAgo(v.startT)}</Row>
                      <Row k={ongoing ? "Duration" : "Resolved"}>
                        {ongoing
                          ? `${fmtDur(NOW - v.startT)} · ongoing`
                          : `${fmtAgo(v.endT as number)} · ${fmtDur((v.endT as number) - v.startT)}`}
                      </Row>
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--se-accent)" }}>
                      View alert ticket →
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* x-axis day ticks */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingLeft: Y_AXIS_W,
          paddingRight: 6,
          ...mono(9.5, "var(--se-fg-4)"),
        }}
      >
        {Array.from({ length: 8 }, (_, i) => t0 + (span * i) / 7).map((t, i) => (
          <span key={i}>{fmtDay(t)}</span>
        ))}
      </div>

      {/* legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 14px",
          borderTop: "1px solid var(--se-line)",
          paddingTop: 10,
          ...mono(10),
        }}
      >
        <Leg swatch={<Bar3 c="var(--se-fg-3)" />}>{cfg.metric}</Leg>
        {showAvg ? <Leg swatch={<Bar3 c="var(--se-fg)" />}>{cfg.windowHours}h avg</Leg> : null}
        {showThreshold ? (
          <Leg swatch={<Dash c={color} />}>
            {CMP[cfg.comparator]}
            {cfg.threshold}
          </Leg>
        ) : null}
        <Leg swatch={<Chip c={color} />}>violation (hover for ticket)</Leg>
      </div>
    </div>
  );
}

// ── render helpers ────────────────────────────────────────────────────────────

function Stat({ value, label, tone }: { value: React.ReactNode; label: string; tone?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontFamily: "var(--se-mono)",
          fontSize: 15,
          lineHeight: 1,
          color: tone ?? "var(--se-fg)",
        }}
      >
        {value}
      </span>
      <span
        style={{
          marginTop: 2,
          fontFamily: "var(--se-mono)",
          fontSize: 9.5,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--se-fg-4)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--se-fg-4)" }}>{k}</span>
      <span style={{ color: "var(--se-fg-2)", textAlign: "right" }}>{children}</span>
    </div>
  );
}

function Leg({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--se-fg-3)" }}>
      {swatch}
      {children}
    </span>
  );
}
function Bar3({ c }: { c: string }) {
  return <span style={{ width: 14, height: 3, borderRadius: 999, background: c }} />;
}
function Dash({ c }: { c: string }) {
  return <span style={{ width: 14, height: 0, borderTop: `1px dashed ${c}` }} />;
}
function Chip({ c }: { c: string }) {
  return (
    <span
      style={{
        width: 12,
        height: 10,
        borderRadius: 2,
        background: `color-mix(in oklab, ${c} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${c} 40%, transparent)`,
      }}
    />
  );
}
