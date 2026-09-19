import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, project, primaryKey, projectId, sessions } = await getWorkspace();

  return (
    <AppShell email={user.email} active="/dashboard">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Home</h1>
      <p className="muted" style={{ marginBottom: "1.75rem" }}>
        Overview of your BrowserBase workspace
      </p>

      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="muted" style={{ fontSize: "0.875rem" }}>API Key</span>
            <span className="badge">{primaryKey ? "Active" : "None"}</span>
          </div>
          <code
            className="mono"
            style={{
              display: "block",
              background: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: "0.75rem",
              color: "#c4b5fd",
            }}
          >
            {primaryKey || "Login again to generate key"}
          </code>
          <Link href="/api-keys" style={{ color: "#a78bfa", fontSize: "0.8rem", marginTop: 10, display: "inline-block" }}>
            Manage API Keys →
          </Link>
        </div>
        <div className="card">
          <span className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: 8 }}>
            Project ID
          </span>
          <code
            className="mono"
            style={{
              display: "block",
              background: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: "0.75rem",
              color: "#a5b4fc",
            }}
          >
            {projectId || "No project"}
          </code>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 10 }}>
            Project: {project?.name || "—"}
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Recent Sessions</h2>
          <Link href="/playgrounds/rest" style={{ color: "#a78bfa", fontSize: "0.8rem" }}>
            Create via REST →
          </Link>
        </div>
        {!sessions.length ? (
          <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
            No sessions yet. Use REST Playground or POST /api/v1/sessions
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
                  <th style={{ paddingBottom: 8 }}>Session</th>
                  <th style={{ paddingBottom: 8 }}>Status</th>
                  <th style={{ paddingBottom: 8 }}>Region</th>
                  <th style={{ paddingBottom: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 10).map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #27272a" }}>
                    <td style={{ padding: "12px 0", fontFamily: "monospace", color: "#c4b5fd" }}>
                      {s.id.slice(0, 20)}…
                    </td>
                    <td style={{ padding: "12px 0" }}>
                      <span className="badge">{s.status}</span>
                    </td>
                    <td style={{ padding: "12px 0" }} className="muted">
                      {s.region}
                    </td>
                    <td style={{ padding: "12px 0" }}>
                      <Link href={`/sessions/${s.id}`} style={{ color: "#a78bfa", fontSize: "0.75rem" }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
