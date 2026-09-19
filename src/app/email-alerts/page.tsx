import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function EmailAlertsPage() {
  const { user } = await getWorkspace();

  const alerts = [
    { id: 1, name: "Session failed", channel: user.email, enabled: true },
    { id: 2, name: "Quota warning", channel: user.email, enabled: true },
    { id: 3, name: "New API key created", channel: user.email, enabled: false },
  ];

  return (
    <AppShell email={user.email} active="/email-alerts">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Email Alerts</h1>
      <p className="muted" style={{ marginBottom: "1.75rem" }}>
        Notifications for session and account events
      </p>
      <div className="card">
        <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
          <thead>
            <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
              <th style={{ paddingBottom: 8 }}>Alert</th>
              <th style={{ paddingBottom: 8 }}>Channel</th>
              <th style={{ paddingBottom: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #27272a" }}>
                <td style={{ padding: "12px 0" }}>{a.name}</td>
                <td style={{ padding: "12px 0" }} className="muted">
                  {a.channel}
                </td>
                <td style={{ padding: "12px 0" }}>
                  <span className="badge">{a.enabled ? "On" : "Off"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
