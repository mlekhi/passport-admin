import { listProtectionStatus, type ProtectionStatus } from "@/lib/vercel";

// Server Component — runs on the server, so the access token never reaches
// the browser. Reads protection state live from the Vercel API.
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  let sites: ProtectionStatus[] = [];
  let error: string | null = null;

  try {
    sites = await listProtectionStatus();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <div className="notice">
        <p>Could not load projects from the Vercel API.</p>
        <p>
          Set <code>VERCEL_ACCESS_TOKEN</code> (and <code>VERCEL_TEAM_ID</code> if
          this is a team) in <code>.env.local</code>. See <code>.env.example</code>.
        </p>
        <p>
          <code>{error}</code>
        </p>
      </div>
    );
  }

  if (sites.length === 0) {
    return <p>No projects found for this account or team.</p>;
  }

  const protectedCount = sites.filter((s) => s.protected).length;

  const unprotectedCount = sites.length - protectedCount;

  return (
    <>
      <p>
        {protectedCount} of {sites.length} microsites protected by Passport
        {unprotectedCount > 0 ? <span className="unprotected"> · {unprotectedCount} unprotected</span> : null}.
      </p>
      <table>
        <thead>
          <tr>
            <th>Microsite</th>
            <th>URL</th>
            <th>Protection</th>
            <th>Deployment type</th>
            <th>Last updated</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.projectId}>
              <td>{site.name}</td>
              <td>
                {site.url ? (
                  <a href={site.url} target="_blank" rel="noreferrer">
                    {site.url}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td>{site.protected ? "Protected" : <span className="unprotected">Unprotected</span>}</td>
              <td>{site.deploymentType ?? "—"}</td>
              <td>{formatDate(site.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function formatDate(epochMs?: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toISOString().slice(0, 10);
}
