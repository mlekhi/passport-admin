// Expand a zip archive into a flat path/bytes list — the same shape a loose
// upload produces, so the rest of the ingest pipeline is archive-agnostic.
import { unzipSync } from "fflate";
import type { IngestFile } from "@/lib/ingest/prepare";

export function expandZip(bytes: Uint8Array): IngestFile[] {
  const entries = unzipSync(bytes);
  return Object.entries(entries)
    // Directory records have empty contents and a trailing slash; only files deploy.
    .filter(([path]) => !path.endsWith("/"))
    .map(([path, content]) => ({ path, bytes: content }));
}
