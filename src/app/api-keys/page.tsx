import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const { user, apiKeys, projectId } = await getWorkspace();

  return (
    <AppShell email={user.email} active="/api-keys">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>API Keys</h1>
      <p className="muted" style={{ marginBottom: "1.75rem" }}>
        Use these keys with Bearer / x-bb-api-key headers. Project:{" "}
        <code className="mono">{projectId || "—"}</code>
      </p>

      <div className="card">
        {!apiKeys.length ? (
          <p className="muted">No keys yet. Sign out and login again to auto-generate.</p>
        ) : (
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
                <th style={{ paddingBottom: 8 }}>Key</th>
                <th style={{ paddingBottom: 8 }}>Status</th>
                <th style={{ paddingBottom: 8 }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k) => (
                <tr key={k.id} style={{ borderBottom: "1px solid #27272a" }}>
                  <td style={{ padding: "12px 0" }}>
                    <code className="mono" style={{ color: "#c4b5fd" }}>
                      {k.full_key || k.key_prefix || k.id}
                    </code>
                  </td>
                  <td style={{ padding: "12px 0" }}>
                    <span className="badge">{k.active ? "Active" : "Revoked"}</span>
                  </td>
                  <td style={{ padding: "12px 0" }} className="muted">
                    {k.created_at ? new Date(k.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Auth headers</h2>
        <pre
          className="mono"
          style={{
            background: "#09090b",
            border: "1px solid #27272a",
            borderRadius: 8,
            padding: "1rem",
            overflow: "auto",
            fontSize: "0.8rem",
            color: "#e4e4e7",
          }}
        >{`x-bb-api-key: ${apiKeys[0]?.full_key || "bb_xxxxx"}
Authorization: Bearer ${apiKeys[0]?.full_key || "bb_xxxxx"}
x-bb-project-id: ${projectId || "proj_xxxxx"}`}</pre>
      </div>
    </AppShell>
  );
}
