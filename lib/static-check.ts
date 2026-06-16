// Validates that an uploaded bundle is a static site — no backend, no build
// step. Pure function (no I/O), safe to use anywhere.

export type StaticCheckInput = { path: string };
export type StaticCheckResult = { ok: boolean; rejected: string[] };

// Filenames that imply a build step, a server runtime, or platform config.
const DENY_BASENAMES = new Set([
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "dockerfile",
  "procfile",
  "requirements.txt",
  "pipfile",
  "go.mod",
  "vercel.json",
  "server.js",
  "server.ts",
  "server.mjs",
]);

// Extensions that imply server-side source code.
const DENY_EXTENSIONS = new Set([".py", ".rb", ".php", ".go", ".rs", ".java"]);

export function staticCheck(files: StaticCheckInput[]): StaticCheckResult {
  const rejected = files.map((f) => f.path).filter(isBackendOrBuild);
  return { ok: rejected.length === 0, rejected };
}

function isBackendOrBuild(path: string): boolean {
  const segments = path.split("/");
  const basename = segments[segments.length - 1].toLowerCase();

  if (DENY_BASENAMES.has(basename)) return true;
  // An `api` directory implies server routes rather than static assets.
  if (segments.some((segment) => segment.toLowerCase() === "api")) return true;

  const dot = basename.lastIndexOf(".");
  const ext = dot === -1 ? "" : basename.slice(dot);
  return DENY_EXTENSIONS.has(ext);
}
