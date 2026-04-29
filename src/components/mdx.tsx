import type { ReactNode } from "react";

type Tone = "info" | "success" | "warn" | "danger";

const ICONS: Record<Tone, string> = {
  info: "i",
  success: "✓",
  warn: "!",
  danger: "×",
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`se-callout tone-${type}`}>
      <span className="se-callout-icon" aria-hidden>
        {ICONS[type]}
      </span>
      <div className="se-callout-body">
        {title ? <strong>{title}</strong> : null}
        {title ? <br /> : null}
        {children}
      </div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <div className="se-steps">{children}</div>;
}

export function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="se-step">
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="se-card-grid">{children}</div>;
}

export function Card({
  href,
  eyebrow,
  title,
  children,
}: {
  href: string;
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <a href={href} className="se-card">
      {eyebrow ? <span className="se-card-eyebrow">{eyebrow}</span> : null}
      <span className="se-card-title">{title}</span>
      {children ? <span className="se-card-desc">{children}</span> : null}
      <span className="se-card-arrow">Read →</span>
    </a>
  );
}

export function Pill({
  tone = "default",
  children,
}: {
  tone?: "default" | "accent" | "info" | "warn";
  children: ReactNode;
}) {
  return (
    <span className={`se-pill ${tone === "default" ? "" : `tone-${tone}`}`}>
      <span className="dot" /> {children}
    </span>
  );
}

export function Terminal({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="se-term">
      <div className="se-term-head">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="se-term-title">{title ?? "shell"}</span>
      </div>
      <div className="se-term-body">{children}</div>
    </div>
  );
}

export function Prompt({ children }: { children: ReactNode }) {
  return <span className="se-term-prompt">$</span>;
}

export function Out({ children }: { children: ReactNode }) {
  return <span className="se-term-out">{children}</span>;
}

/* Landing hero — used on the root index */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="se-hero not-prose">
      {eyebrow ? (
        <div className="se-hero-eyebrow">
          <span className="dot" />
          {eyebrow}
        </div>
      ) : null}
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {primaryHref || secondaryHref ? (
        <div className="se-hero-cta">
          {primaryHref ? (
            <a className="se-btn se-btn-primary" href={primaryHref}>
              {primaryLabel ?? "Get started"}
              <span className="arr">→</span>
            </a>
          ) : null}
          {secondaryHref ? (
            <a className="se-btn se-btn-ghost" href={secondaryHref}>
              {secondaryLabel ?? "Read more"}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
