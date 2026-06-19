import type { CSSProperties, ReactNode } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Doc scenes — inline "kind-of-screenshot" illustrations + one animated hero.

   These are the docs analogue of a product screenshot: static or ambiently
   animated mock surfaces built from the same `se-` design tokens the rest of
   the site uses, so a reader sees the feature before they read about it.

   Rules (mirrors the help-article scene discipline):
   - Pure presentational. No client state, no data fetching, no "use client".
     Every reader sees the same picture in every theme.
   - Animation is CSS-only (keyframes in theme.css under "DOC SCENES"), so it
     survives the static export and respects `prefers-reduced-motion`.
   - Frame every scene in <SceneFrame caption=…> — the caption is what a
     screen reader announces, so it is required.
   ────────────────────────────────────────────────────────────────────────── */

export function SceneFrame({
  caption,
  label,
  children,
}: {
  caption: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <figure className="se-scene not-prose">
      <div className="se-scene-stage">
        {label ? <span className="se-scene-label">{label}</span> : null}
        {children}
      </div>
      <figcaption className="se-scene-cap">{caption}</figcaption>
    </figure>
  );
}

/* ──────────────────────────────────────────────────────────────
   Devtools hero — flagship animated banner for the devtools page.
   A mock browser frame; the floating rail slides in bottom-right,
   a cursor opens it, and a "Report filed" toast confirms. Loops.
   ────────────────────────────────────────────────────────────── */
export function DevtoolsHero() {
  return (
    <section className="se-dvt-hero not-prose" aria-label="The devtools overlay in action">
      <span className="se-dvt-frame-pill">A look at devtools</span>
      <div className="se-dvt-blob a" aria-hidden />
      <div className="se-dvt-blob b" aria-hidden />

      <div className="se-dvt-window" aria-hidden>
        <div className="se-dvt-chrome">
          <span className="d r" />
          <span className="d y" />
          <span className="d g" />
          <span className="se-dvt-url">app.acme.com/?se</span>
        </div>
        <div className="se-dvt-page">
          <div className="se-dvt-skel w1" />
          <div className="se-dvt-skel w2" />
          <div className="se-dvt-skel w3" />

          {/* the floating rail */}
          <div className="se-dvt-rail">
            <div className="se-dvt-rail-head">
              <span className="se-dvt-rail-dot" />
              shipeasy
            </div>
            <div className="se-dvt-rail-row hot">
              <span className="ico">◎</span> File a bug
            </div>
            <div className="se-dvt-rail-row">
              <span className="ico">✦</span> Request a feature
            </div>
            <div className="se-dvt-rail-row">
              <span className="ico">⚑</span> Flags &amp; configs
            </div>
          </div>

          {/* animated cursor */}
          <span className="se-dvt-cursor" />

          {/* confirmation toast */}
          <div className="se-dvt-toast">
            <span className="se-dvt-toast-ico">✓</span> Report filed → dashboard
          </div>
        </div>
      </div>

      <div className="se-dvt-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   Devtools capture — inline card showing what one report grabs.
   ────────────────────────────────────────────────────────────── */
export function CaptureScene() {
  return (
    <SceneFrame
      label="Auto-attached"
      caption="Every report carries the page context automatically — no “where were you?” round-trip."
    >
      <div className="se-cap">
        <div className="se-cap-form">
          <span className="se-cap-k">BUG REPORT</span>
          <div className="se-cap-title">Checkout total double-counts tax</div>
          <div className="se-cap-line w1" />
          <div className="se-cap-line w2" />
          <div className="se-cap-actions">
            <span className="se-cap-btn">◷ Screenshot</span>
            <span className="se-cap-btn">● Record</span>
          </div>
        </div>
        <div className="se-cap-meta">
          <div className="se-cap-meta-h">Attached for you</div>
          <div className="se-cap-chip">
            <b>pageUrl</b> /checkout
          </div>
          <div className="se-cap-chip">
            <b>viewport</b> 1440×900
          </div>
          <div className="se-cap-chip">
            <b>userAgent</b> Chrome 126
          </div>
          <div className="se-cap-chip ok">
            <span className="dot" /> posting…
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}

/* ──────────────────────────────────────────────────────────────
   Rollout scene — the bucket bar. 0..9,999 buckets as a track; the
   cutoff sweeps 5% → 25% and the fill is additive (old buckets stay).
   ────────────────────────────────────────────────────────────── */
export function RolloutScene() {
  return (
    <SceneFrame caption="Ramping 5% → 25% only adds buckets — every user already inside stays inside. No re-shuffle.">
      <div className="se-roll">
        <div className="se-roll-head">
          <span className="se-roll-name">checkout-v2</span>
          <span className="se-roll-pct">
            5% <span className="arr">→</span> 25% rollout
          </span>
        </div>
        <div className="se-roll-track">
          <div className="se-roll-fill" />
        </div>
        <div className="se-roll-scale">
          <span>0</span>
          <span>5,000</span>
          <span>9,999</span>
        </div>
        <div className="se-roll-legend">
          <span className="in">
            <span className="sw" /> in (true)
          </span>
          <span className="out">
            <span className="sw" /> out (false)
          </span>
          <code>bucket = hash(salt:userId) mod 10000</code>
        </div>
      </div>
    </SceneFrame>
  );
}

/* ──────────────────────────────────────────────────────────────
   Confidence scene — a CI whisker plot read off a result row.
   Zero line down the middle; control sits on it, v1's interval
   slides in to the right and excludes 0 → ship it.
   ────────────────────────────────────────────────────────────── */
export function ConfidenceScene() {
  return (
    <SceneFrame caption="A 95% CI that excludes the zero line — narrow and to the right. That is a result you can ship.">
      <div className="se-ci">
        <div className="se-ci-h">purchase_conversion · last 7 days</div>
        <div className="se-ci-zero" aria-hidden>
          <span className="se-ci-zero-lab">0</span>
        </div>

        <div className="se-ci-row">
          <span className="se-ci-name">control</span>
          <div className="se-ci-plot">
            <span className="se-ci-point" style={{ left: "50%" }} />
          </div>
          <span className="se-ci-stat">4.8%</span>
        </div>

        <div className="se-ci-row">
          <span className="se-ci-name win">v1</span>
          <div className="se-ci-plot">
            <span className="se-ci-bar" />
            <span className="se-ci-point win" />
          </div>
          <span className="se-ci-stat win">
            +8.3%<small>p=0.018</small>
          </span>
        </div>
      </div>
    </SceneFrame>
  );
}

/* ──────────────────────────────────────────────────────────────
   Locale fan — one source key fanning out to locales that light
   up one after another as the publish reaches the edge.
   ────────────────────────────────────────────────────────────── */
export function LocaleFanScene() {
  const locales = ["fr", "de", "es", "pt-BR", "ja", "ar"];
  return (
    <SceneFrame
      label="publish → edge"
      caption="One source key, drafted by Claude, lights up every locale worldwide in seconds — no redeploy."
    >
      <div className="se-loc">
        <div className="se-loc-src">
          <span className="se-loc-k">landing.hero.title</span>
          <span className="se-loc-v">“Localize, as easy as asking Claude.”</span>
          <span className="se-loc-src-tag">en · source</span>
        </div>
        <div className="se-loc-beam" aria-hidden />
        <div className="se-loc-grid">
          {locales.map((l, i) => (
            <span key={l} className="se-loc-chip" style={{ "--i": i } as CSSProperties}>
              <span className="se-loc-chip-dot" />
              {l}
            </span>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
}

/* ──────────────────────────────────────────────────────────────
   Metric pulse — an event stream collapsing into one number, with
   a sparkline that draws itself. The "what a metric is" picture.
   ────────────────────────────────────────────────────────────── */
export function MetricPulseScene() {
  return (
    <SceneFrame
      label="metric"
      caption="A metric collapses each user’s event stream into one number — here, conversion drawn over 7 days."
    >
      <div className="se-met">
        <div className="se-met-tile">
          <span className="se-met-k">purchase_conversion</span>
          <span className="se-met-val">
            5.2<span className="u">%</span>
          </span>
          <span className="se-met-lift">▲ +8.3% vs control</span>
          <svg className="se-met-spark" viewBox="0 0 200 56" preserveAspectRatio="none">
            <polyline
              className="se-met-line"
              points="0,44 28,40 56,42 84,32 112,30 140,20 168,16 200,8"
            />
          </svg>
        </div>
        <div className="se-met-feed">
          <span className="se-met-k">event stream · user u_42</span>
          <div className="se-met-ev">
            <span className="t">10:07</span> $exposure <span className="g v1">v1</span>
          </div>
          <div className="se-met-ev">
            <span className="t">10:09</span> click
          </div>
          <div className="se-met-ev hot">
            <span className="t">10:14</span> purchase <span className="g">value=49</span>
          </div>
          <div className="se-met-arrow">collapses to → 1</div>
        </div>
      </div>
    </SceneFrame>
  );
}
