import { filesFromForm } from "@/lib/ingest/read-form";
import { prepareUpload, toDeploymentFiles, type IngestErrorCode } from "@/lib/ingest/prepare";
import { createProjectAndDeploy, protectProject } from "@/lib/vercel";

// The gateway ingest endpoint. A client POSTs a multipart upload — either a
// single `.zip` or loose static files. We expand/validate it, deploy it as its
// own Vercel project, protect it with Passport, and return the URL — only once
// protection is confirmed.
//
// Errors are returned as { error, code } so the calling skill can act on the
// reason (e.g. "remove your api/ route") rather than just failing opaquely.

// Validation failures map to a status by whether the upload was malformed
// (400) or simply not a deployable static site (422).
const ERROR_STATUS: Record<IngestErrorCode, number> = {
  empty: 400,
  duplicate: 400,
  not_static: 422,
  no_root_index: 422,
};

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "Expected a multipart/form-data upload", code: "bad_request" }, { status: 400 });
  }

  let files;
  try {
    files = await filesFromForm(form);
  } catch (error) {
    return Response.json({ error: `Could not read the zip: ${messageOf(error)}`, code: "bad_zip" }, { status: 400 });
  }

  const prepared = prepareUpload(files);
  if ("code" in prepared) {
    return Response.json(
      { error: prepared.message, code: prepared.code, rejected: prepared.rejected },
      { status: ERROR_STATUS[prepared.code] },
    );
  }

  let deployment: { id: string; projectId: string; url: string };
  try {
    deployment = await createProjectAndDeploy(toDeploymentFiles(prepared.files));
  } catch (error) {
    return Response.json({ error: messageOf(error), code: "deploy_failed" }, { status: 502 });
  }

  try {
    await protectProject({ projectId: deployment.projectId });
  } catch (error) {
    // Deployed but Passport didn't take — tell the client not to share the URL.
    return Response.json(
      { error: "Deployed but not protected", code: "not_protected", url: deployment.url, detail: messageOf(error) },
      { status: 409 },
    );
  }

  return Response.json({ url: deployment.url }, { status: 200 });
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
