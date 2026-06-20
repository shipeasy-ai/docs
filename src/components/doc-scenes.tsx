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

/* ──────────────────────────────────────────────────────────────────────────
   Assistant scenes — static replicas of the in-dashboard assistant's reply
   elements, one per workflow. They mirror the real cards in apps/ui (the
   /plan-gallery stubs): the read-mode thinking trace, the ask_user chooser,
   the write-tool confirmation card, and the suggest_plan plan card. Pure
   markup + `--se-*` tokens, no animation — they're product screenshots of a
   single chat turn.
   ────────────────────────────────────────────────────────────────────────── */

/* Read mode — auto-executed read tools stream as a ✓ trace, then a grounded,
   doc-cited answer. Nothing is mutated, so there's no card. */
export function AssistantReadScene() {
  return (
    <SceneFrame
      label="read · auto"
      caption="Read tools run on their own and stream as a ✓ trace; the answer is grounded in your project and cites its docs. Nothing changes."
    >
      <div className="se-asst">
        <div className="se-asst-user">
          Which feature flags are at 100% but haven’t been touched in 90 days?
        </div>
        <div className="se-asst-trace">
          <div className="se-asst-tstep">
            <span className="se-asst-tick">✓</span> Reading your project
          </div>
          <div className="se-asst-tstep">
            <span className="se-asst-tick">✓</span> Checking experiment status
          </div>
          <div className="se-asst-tstep">
            <span className="se-asst-tick">✓</span> Searching the docs
          </div>
        </div>
        <div className="se-asst-answer">
          Three flags are pinned at 100% and untouched for 90+ days — safe to retire:
          <ul className="se-asst-list">
            <li>
              <code>legacy_checkout</code> — fully rolled out, no rule references it
            </li>
            <li>
              <code>dark_mode</code> — at 100% since March, experiment finished
            </li>
            <li>
              <code>beta_banner</code> — superseded by <code>nux_banner</code>
            </li>
          </ul>
          <div className="se-asst-sources">Sources: Retiring flags · Flag lifecycle</div>
        </div>
      </div>
    </SceneFrame>
  );
}

/* ask_user — the chooser. Single-choice renders radios and submits on pick;
   multi-select renders checkboxes and submits on Confirm. */
export function AssistantChooserScene({ multi = false }: { multi?: boolean }) {
  const opts = multi
    ? [
        { label: "Latency", detail: "p95 response time", on: true },
        { label: "Error rate", detail: "5xx / client errors", on: true },
        { label: "Refunds", detail: "post-purchase refunds", on: false },
      ]
    : [
        { label: "Signups", detail: "Maximise completed registrations", on: false },
        { label: "Revenue", detail: "Maximise checkout value", on: true },
        { label: "Retention", detail: "Maximise 7-day return rate", on: false },
      ];
  return (
    <SceneFrame
      label="ask_user"
      caption={
        multi
          ? "Multi-select: checkboxes, submitted together on Confirm — for picking a set of guardrails."
          : "Single-choice: radio options the assistant offers when it needs one decision to continue. Picking one resumes the chat."
      }
    >
      <div className="se-asst-chooser" data-multi={multi ? "true" : "false"}>
        <div className="se-asst-q">
          {multi ? "Which guardrails should we watch?" : "Which outcome should we optimise for?"}
        </div>
        <div className="se-asst-opts">
          {opts.map((o) => (
            <div key={o.label} className="se-asst-opt" data-on={o.on ? "true" : "false"}>
              <span
                className="se-asst-box"
                style={{ borderRadius: multi ? "0.3rem" : "9999px" }}
                aria-hidden
              >
                {o.on ? (
                  multi ? (
                    <span className="se-asst-box-check">✓</span>
                  ) : (
                    <span className="se-asst-box-dot" />
                  )
                ) : null}
              </span>
              <span className="se-asst-opt-txt">
                <span className="se-asst-opt-label">{o.label}</span>
                <span className="se-asst-opt-detail">{o.detail}</span>
              </span>
            </div>
          ))}
          <div className="se-asst-opt se-asst-opt-other">
            <span className="se-asst-box" style={{ opacity: 0.45 }} aria-hidden />
            <span className="se-asst-opt-input">Something else…</span>
          </div>
        </div>
        <div className="se-asst-confirm">
          <span className="se-asst-btn primary">Confirm{multi ? " (2)" : ""}</span>
          {multi ? <span className="se-asst-btn ghost">Clear</span> : null}
        </div>
      </div>
    </SceneFrame>
  );
}

/* Write tool — the confirmation card. The assistant proposes a resource; it
   renders read-only (name inline-editable) and only mutates on Confirm. */
export function AssistantCardScene({ kind = "gate" }: { kind?: "gate" | "experiment" }) {
  if (kind === "experiment") {
    return (
      <SceneFrame
        label="write · confirm"
        caption="An experiment proposal: groups, weights, allocation, and the success + guardrail metrics — editable, applied only on Confirm."
      >
        <div className="se-asst-card">
          <div className="se-asst-card-head">
            <span className="se-asst-card-ico">⧉</span>
            <span className="se-asst-card-kind">Create experiment</span>
          </div>
          <div className="se-asst-card-name">new-checkout-flow</div>
          <div className="se-asst-rows">
            <div className="se-asst-row">
              <span className="se-asst-row-k">Groups</span>
              <div className="se-asst-groups">
                <span className="se-asst-grp" style={{ width: "34%" }}>
                  control · 34
                </span>
                <span className="se-asst-grp v" style={{ width: "33%" }}>
                  variant_a · 33
                </span>
                <span className="se-asst-grp v2" style={{ width: "33%" }}>
                  variant_b · 33
                </span>
              </div>
            </div>
            <div className="se-asst-row">
              <span className="se-asst-row-k">Allocation</span>
              <span className="se-asst-row-v">10% of the universe</span>
            </div>
            <div className="se-asst-row">
              <span className="se-asst-row-k">Goal</span>
              <span className="se-asst-row-v">
                ↑ <code>checkout_completed</code> · count_users
              </span>
            </div>
            <div className="se-asst-row">
              <span className="se-asst-row-k">Guardrails</span>
              <span className="se-asst-chips">
                <span className="se-asst-chip">avg(latency_ms)</span>
                <span className="se-asst-chip">error_shown</span>
                <span className="se-asst-chip">refund</span>
              </span>
            </div>
          </div>
          <p className="se-asst-card-hint">
            Tweak the title and the highlighted controls here. To change anything else, ask in the
            chat and the assistant revises the plan.
          </p>
          <div className="se-asst-card-actions">
            <span className="se-asst-btn primary">Confirm</span>
            <span className="se-asst-btn ghost">Cancel</span>
          </div>
        </div>
      </SceneFrame>
    );
  }
  return (
    <SceneFrame
      label="write · confirm"
      caption="A write tool surfaces as an editable card — never auto-run. Rules show as chips and the rollout as a bar, exactly like the dashboard; it applies only on Confirm."
    >
      <div className="se-asst-card">
        <div className="se-asst-card-head">
          <span className="se-asst-card-ico">⚑</span>
          <span className="se-asst-card-kind">Create feature flag</span>
        </div>
        <div className="se-asst-card-name">checkout_redesign</div>
        <div className="se-asst-rows">
          <div className="se-asst-row">
            <span className="se-asst-row-k">When</span>
            <span className="se-asst-chips">
              <span className="se-asst-chip">
                country <b>in</b> [US]
              </span>
            </span>
          </div>
          <div className="se-asst-row">
            <span className="se-asst-row-k">Rollout</span>
            <div className="se-asst-rollout">
              <div className="se-asst-rollout-fill" style={{ width: "10%" }} />
            </div>
            <span className="se-asst-row-v">10%</span>
          </div>
          <div className="se-asst-row">
            <span className="se-asst-row-k">Default</span>
            <span className="se-asst-row-v">off</span>
          </div>
        </div>
        <p className="se-asst-card-hint">
          Tweak the title and the highlighted controls here. To change anything else, ask in the
          chat and the assistant revises the plan.
        </p>
        <div className="se-asst-card-actions">
          <span className="se-asst-btn primary">Confirm</span>
          <span className="se-asst-btn ghost">Cancel</span>
        </div>
      </div>
    </SceneFrame>
  );
}

/* suggest_plan — the plan card. Ordered steps split into Instant resources
   (created on approve) and Ship-code work (filed as a measure_plan ticket).
   `resolved` shows the post-approval receipt. */
export function AssistantPlanScene({ resolved = false }: { resolved?: boolean }) {
  const steps = [
    {
      n: 1,
      label: "Create metric checkout_conversion_rate",
      kind: "instant" as const,
      detail: "count_users(checkout_completed) / count_users(checkout_started)",
    },
    {
      n: 2,
      label: "Create experiment new-checkout-flow",
      kind: "instant" as const,
      detail: "control 50% · variant 50% · goal ↑ checkout_conversion_rate",
    },
    {
      n: 3,
      label: "Instrument checkout_completed",
      kind: "ship" as const,
      detail: "Emit on the order-confirmation screen.",
    },
  ];
  return (
    <SceneFrame
      label="suggest_plan"
      caption={
        resolved
          ? "After Approve: the instant resources are created and the ship steps become a measure_plan ticket for your crew — receipt fed back to the chat."
          : "A plan separates Instant resources (created on approve) from Ship-code work (filed as a ticket). One approvable unit for a whole measurement."
      }
    >
      <div className="se-asst-plan">
        <div className="se-asst-plan-head">
          <span className="se-asst-plan-badge">Plan</span>
          <span className="se-asst-plan-title">Measure checkout funnel</span>
        </div>
        <div className="se-asst-plan-body">
          {steps.map((s) => (
            <div key={s.n} className="se-asst-pstep">
              <div className="se-asst-pnum">{s.n}</div>
              <div className="se-asst-pbody">
                <div className="se-asst-plabel">
                  <span>{s.label}</span>
                  <span className={`se-asst-pkind ${s.kind}`}>
                    {s.kind === "ship" ? "⚒ Ship run" : "⚡ Instant"}
                  </span>
                </div>
                <div className="se-asst-pdetail">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="se-asst-plan-note">
          <span className="se-asst-plan-dot" />1 code edit → filed to your ship crew · 2 instant
        </div>
        {resolved ? (
          <div className="se-asst-plan-done">
            <span className="se-asst-tick">✓</span> Created 2 resources; filed measure-plan ticket
            #42 for 1 item to implement.
          </div>
        ) : (
          <div className="se-asst-card-actions">
            <span className="se-asst-btn primary">Approve plan</span>
            <span className="se-asst-btn ghost">Dismiss</span>
          </div>
        )}
      </div>
    </SceneFrame>
  );
}
