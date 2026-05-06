"use client";

import { useState } from "react";

type Pkg = "npm" | "pnpm" | "yarn" | "bun";

const TABS: Pkg[] = ["npm", "pnpm", "yarn", "bun"];

export function InstallTabsClient({ cmds }: { cmds: Record<Pkg, string> }) {
  const [active, setActive] = useState<Pkg>("npm");
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard?.writeText(cmds[active]).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {},
    );
  };

  return (
    <div className="se-install not-prose">
      <div className="se-install-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`se-install-tab ${t === active ? "active" : ""}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="se-install-body">
        <span className="p">$</span>
        <span>{cmds[active]}</span>
        <button type="button" className="copy" onClick={onCopy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
