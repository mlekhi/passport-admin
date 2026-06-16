import { staticCheck } from "@/lib/static-check";
import { createProjectAndDeploy, protectProject, type DeploymentFile } from "@/lib/vercel";

// The gateway ingest endpoint. A client posts a static bundle; we validate it,
// deploy it as its own Vercel project, protect it with Passport, and return the
// URL — only once protection is confirmed.
type IngestFile = { path: string; content: string };

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const files: IngestFile[] = Array.isArray(body?.files) ? body.files : [];

  if (files.length === 0) {
    return Response.json({ error: "No files provided" }, { status: 400 });
  }

  const check = staticCheck(files);
  if (!check.ok) {
    return Response.json(
      { error: "Not a static site; remove backend/build files and retry", rejected: check.rejected },
      { status: 422 },
    );
  }

  let deployment: { id: string; projectId: string; url: string };
  try {
    deployment = await createProjectAndDeploy(toDeploymentFiles(files));
  } catch (error) {
    return Response.json({ error: messageOf(error) }, { status: 502 });
  }

  try {
    await protectProject({ projectId: deployment.projectId });
  } catch (error) {
    // Deployed but Passport didn't take — tell the client not to share the URL.
    return Response.json(
      { error: "Deployed but not protected", url: deployment.url, detail: messageOf(error) },
      { status: 409 },
    );
  }

  return Response.json({ url: deployment.url }, { status: 200 });
}

function toDeploymentFiles(files: IngestFile[]): DeploymentFile[] {
  return files.map((f) => ({
    file: f.path,
    data: Buffer.from(f.content).toString("base64"),
    encoding: "base64",
  }));
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
