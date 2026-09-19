import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const { user, sessions } = await getWorkspace();

  return (
    <AppShell email={user.email} active="/tools/logs">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Logs</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Session activity from your project (live Supabase data)
      </p>
      <div className="card">
        {!sessions.length ? (
          <p className="muted">No session logs yet.</p>
        ) : (
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <thead>
              <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
                <th style={{ paddingBottom: 8 }}>Time</th>
                <th style={{ paddingBottom: 8 }}>Event</th>
                <th style={{ paddingBottom: 8 }}>Session</th>
                <th style={{ paddingBottom: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #27272a" }}>
                  <td style={{ padding: "10px 0" }} className="muted">
                    {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "10px 0" }}>session.created</td>
                  <td style={{ padding: "10px 0" }}>
                    <Link href={`/sessions/${s.id}`} style={{ color: "#a78bfa", fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {s.id.slice(0, 16)}…
                    </Link>
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    <span className="badge">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
