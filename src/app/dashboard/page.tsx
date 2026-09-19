import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, project, primaryKey, projectId, sessions } = await getWorkspace();

  return (
    <AppShell email={user.email} active="/dashboard">
      <h1 className="page-title">Home</h1>
      <p className="page-sub">Your BrowserBase workspace</p>

      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
            <span className="muted" style={{ fontSize: "0.8rem" }}>API Key</span>
            <span className="badge">{primaryKey ? "Active" : "None"}</span>
          </div>
          <code className="mono" style={codeBox}>{primaryKey || "Login again to generate key"}</code>
          <Link href="/api-keys" style={{ color: "#a78bfa", fontSize: "0.8rem", marginTop: 10, display: "inline-block" }}>
            Manage keys →
          </Link>
        </div>
        <div className="card">
          <span className="muted" style={{ fontSize: "0.8rem", display: "block", marginBottom: 8 }}>Project ID</span>
          <code className="mono" style={{ ...codeBox, color: "#a5b4fc" }}>{projectId || "No project"}</code>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 10 }}>Project: {project?.name || "—"}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Recent Sessions</h2>
          <Link href="/playgrounds/rest" style={{ color: "#a78bfa", fontSize: "0.8rem" }}>REST Playground →</Link>
        </div>
        {!sessions.length ? (
          <p className="muted" style={{ textAlign: "center", padding: "1.5rem 0", fontSize: "0.9rem" }}>
            No sessions yet
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table-responsive" style={{ fontSize: "0.85rem" }}>
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
                    <td data-label="Session" style={{ padding: "10px 0", fontFamily: "monospace", color: "#c4b5fd" }}>
                      {s.id.slice(0, 16)}…
                    </td>
                    <td data-label="Status" style={{ padding: "10px 0" }}><span className="badge">{s.status}</span></td>
                    <td data-label="Region" style={{ padding: "10px 0" }} className="muted">{s.region}</td>
                    <td data-label="" style={{ padding: "10px 0" }}>
                      <Link href={`/sessions/${s.id}`} style={{ color: "#a78bfa", fontSize: "0.75rem" }}>View →</Link>
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

const codeBox: React.CSSProperties = {
  display: "block",
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "0.65rem",
  color: "#c4b5fd",
};
