import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { user, project } = await getWorkspace();

  return (
    <AppShell email={user.email} active="/users">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Users</h1>
      <p className="muted" style={{ marginBottom: "1.75rem" }}>
        Workspace members (current account)
      </p>
      <div className="card">
        <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
          <thead>
            <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
              <th style={{ paddingBottom: 8 }}>Email</th>
              <th style={{ paddingBottom: 8 }}>User ID</th>
              <th style={{ paddingBottom: 8 }}>Role</th>
              <th style={{ paddingBottom: 8 }}>Project</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #27272a" }}>
              <td style={{ padding: "12px 0" }}>{user.email}</td>
              <td style={{ padding: "12px 0", fontFamily: "monospace", fontSize: "0.75rem" }} className="muted">
                {user.id}
              </td>
              <td style={{ padding: "12px 0" }}>
                <span className="badge">Owner</span>
              </td>
              <td style={{ padding: "12px 0" }} className="muted">
                {project?.name || "Default"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
