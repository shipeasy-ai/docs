import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { createMDX } from "fumadocs-mdx/next";

// Which commit this export was built from, stamped into every page as
// <meta name="docs-build"> so a report of "the same URL served two different
// bodies" can be attributed to a deployed build (or ruled out) from the HTML
// alone. Workers Builds sets WORKERS_CI_COMMIT_SHA; a local build asks git.
function buildSha(): string {
  const ci = process.env.WORKERS_CI_COMMIT_SHA;
  if (ci) return ci.slice(0, 12);
  try {
    return execSync("git rev-parse --short=12 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const withMDX = createMDX();

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    DOCS_BUILD_SHA: buildSha(),
    DOCS_BUILD_TIME: new Date().toISOString(),
  },
};

export default withMDX(nextConfig);
