import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function McpDocsPage() {
  const { user } = await getWorkspace();
  const base = "https://browserbase-clone-open-source1.vercel.app";

  return (
    <AppShell email={user.email} active="/docs/mcp">
      <h1 className="page-title">MCP Connect</h1>
      <p className="page-sub">
        Real OAuth approval · only ChatGPT, Claude, Gemini, Grok, Lovable, Base44, Cursor, Codex
      </p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>MCP Server URL</h2>
        <code className="mono" style={box}>
          {base}/api/mcp
        </code>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>OAuth</h2>
        <pre className="mono code-block" style={box}>{`Authorize: ${base}/oauth/authorize
Token:     ${base}/oauth/token
Metadata:  ${base}/.well-known/oauth-authorization-server

Example authorize URL:
${base}/oauth/authorize?client_id=cursor&client_name=cursor&redirect_uri=https://YOUR_APP/callback&response_type=code&scope=mcp&state=xyz`}</pre>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Flow</h2>
        <ol className="muted" style={{ paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
          <li>Client opens authorize URL (must be allowed client)</li>
          <li>You login (Google) if needed</li>
          <li>Approval screen — Approve / Deny</li>
          <li>Redirect with ?code=…</li>
          <li>Exchange code at /oauth/token → access_token</li>
          <li>Call MCP tools with Authorization: Bearer &lt;access_token&gt;</li>
        </ol>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>MCP tools</h2>
        <ul className="muted" style={{ paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
          <li>get_workspace — project id + key preview</li>
          <li>get_api_keys — full keys</li>
          <li>list_sessions / get_session / create_session</li>
          <li>get_docs — endpoints + curl / React examples</li>
          <li>list_pages — all site pages</li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Blocked clients</h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Any client not in the allowlist receives <code>403 unauthorized_client</code>. Random apps and
          unknown user-agents cannot complete OAuth or use MCP tools.
        </p>
      </div>
    </AppShell>
  );
}

const box: React.CSSProperties = {
  display: "block",
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "0.75rem",
  color: "#c4b5fd",
  whiteSpace: "pre-wrap",
};
