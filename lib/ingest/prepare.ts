// Turns a raw list of uploaded files (from a zip expansion or loose upload)
// into a deployable static bundle, or a structured rejection. Pure (no I/O).
import { staticCheck } from "@/lib/static-check";
import type { DeploymentFile } from "@/lib/vercel";

export type IngestFile = { path: string; bytes: Uint8Array };

export type PreparedUpload = { files: IngestFile[] };

export type IngestErrorCode = "empty" | "duplicate" | "not_static" | "no_root_index";
export type IngestError = { code: IngestErrorCode; message: string; rejected?: string[] };

// Noise that should never be deployed — mirrors the Vercel CLI / Drop ignore
// list. Matched per path segment so a directory like `.git/` drops entirely.
const IGNORED_NAMES = new Set([
  ".git",
  ".gitmodules",
  ".hg",
  ".svn",
  ".cache",
  ".next",
  ".vercel",
  ".DS_Store",
  "node_modules",
  "__MACOSX",
  "__pycache__",
  "Thumbs.db",
  ".env.local",
]);
const IGNORED_PATTERNS = [
  /^\..*\.swp$/, // editor swap files: .*.swp
  /^\.env\..*\.local$/, // .env.*.local
];

function isIgnored(path: string): boolean {
  return path.split("/").some(
    (segment) => IGNORED_NAMES.has(segment) || IGNORED_PATTERNS.some((re) => re.test(segment)),
  );
}

export function prepareUpload(input: IngestFile[]): PreparedUpload | IngestError {
  // Filter junk first, then enforce the static-only policy on what remains —
  // so a good site isn't rejected over trash (a stray node_modules) it carried.
  const filtered = input.filter((file) => !isIgnored(file.path));
  if (filtered.length === 0) {
    return { code: "empty", message: "No deployable files found." };
  }

  // A wrapping folder is a packaging artifact, not a URL segment — deploy its
  // contents at the root.
  const root = commonRootDirectory(filtered);
  const files = root ? stripRootDirectory(filtered, root) : filtered;

  const seen = new Set<string>();
  for (const { path } of files) {
    if (seen.has(path)) {
      return { code: "duplicate", message: `${path} appears more than once.` };
    }
    seen.add(path);
  }

  const check = staticCheck(files);
  if (!check.ok) {
    return {
      code: "not_static",
      message: "Not a static site; remove backend/build files and retry.",
      rejected: check.rejected,
    };
  }

  if (!files.some(({ path }) => path === "index.html")) {
    return { code: "no_root_index", message: "No index.html at the root to serve at /." };
  }

  return { files };
}

function commonRootDirectory(files: IngestFile[]): string | null {
  const first = files[0]?.path ?? "";
  const slash = first.indexOf("/");
  if (slash === -1) return null;
  const root = first.slice(0, slash);
  return files.every(({ path }) => path.startsWith(`${root}/`)) ? root : null;
}

function stripRootDirectory(files: IngestFile[], root: string): IngestFile[] {
  const prefix = `${root}/`;
  return files.map(({ bytes, path }) => ({ bytes, path: path.slice(prefix.length) }));
}

// Base64 of the raw bytes — never via a string, which would corrupt any
// non-UTF-8 byte (the old ingest bug).
export function toDeploymentFiles(files: IngestFile[]): DeploymentFile[] {
  return files.map(({ path, bytes }) => ({
    file: path,
    data: Buffer.from(bytes).toString("base64"),
    encoding: "base64",
  }));
}
