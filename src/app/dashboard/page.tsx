import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("bb_projects")
    .select("id, name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const { data: apiKey } = await supabase
    .from("bb_api_keys")
    .select("full_key, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("bb_sessions")
    .select("id, status, region, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const displayKey = apiKey?.full_key || "No key yet — login again";
  const projectId = project?.id || "No project";

  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="header">
        <div className="header-inner">
          <strong>BrowserBase</strong>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: "0.875rem" }}>{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="muted" style={{ background: "none", fontSize: "0.875rem" }}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Overview</h1>
        <p className="muted" style={{ marginBottom: "2rem" }}>Your cloud browser workspace</p>

        <div className="grid-2" style={{ marginBottom: "2rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span className="muted" style={{ fontSize: "0.875rem" }}>API Key</span>
              <span className="badge">Active</span>
            </div>
            <code className="mono" style={{ display: "block", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "0.75rem", color: "#c4b5fd" }}>
              {displayKey}
            </code>
          </div>
          <div className="card">
            <span className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.75rem" }}>Project ID</span>
            <code className="mono" style={{ display: "block", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "0.75rem", color: "#a5b4fc" }}>
              {projectId}
            </code>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Recent Sessions</h2>
          {!sessions?.length ? (
            <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
              No sessions yet. POST /api/v1/sessions with your API key.
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
                  {sessions.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #27272a" }}>
                      <td style={{ padding: "12px 0", fontFamily: "monospace", color: "#c4b5fd" }}>{s.id.slice(0, 18)}...</td>
                      <td style={{ padding: "12px 0" }}><span className="badge">{s.status}</span></td>
                      <td style={{ padding: "12px 0" }} className="muted">{s.region}</td>
                      <td style={{ padding: "12px 0" }}>
                        <Link href={`/sessions/${s.id}`} style={{ color: "#a78bfa", fontSize: "0.75rem" }}>View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
