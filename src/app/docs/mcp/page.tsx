import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function McpDocsPage() {
  const { user } = await getWorkspace();
  const base = "https://browserbase-clone-open-source1.vercel.app";

  return (
    <AppShell email={user.email} active="/docs/mcp">
      <h1 className="page-title">MCP Connect · Fixed OAuth</h1>
      <p className="page-sub">Working client_id + client_secret · PKCE supported · Approve flow</p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>MCP Server URL</h2>
        <code className="mono" style={box}>
          {base}/api/mcp
        </code>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>
          Custom Connector credentials (copy-paste)
        </h2>
        <pre className="mono code-block" style={box}>{`Client ID:                 bb_mcp_chatgpt
Client Secret:             bb_mcp_connect_secret_live_2026
Authorization Endpoint:    ${base}/oauth/authorize
Token Endpoint:            ${base}/oauth/token
Scopes:                    mcp
Token Auth Method:         client_secret_post   (or none / PKCE)

Aliases (same secret):
  bb_mcp_claude · bb_mcp_cursor · bb_mcp_gemini · bb_mcp_grok
  bb_mcp_codex · bb_mcp_lovable · bb_mcp_base44
  chatgpt · claude · cursor · openai`}</pre>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Steps</h2>
        <ol className="muted" style={{ paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
          <li>Paste credentials above into Custom Connector</li>
          <li>Connect → browser opens Authorize → Google login if needed</li>
          <li>Click <strong>Approve</strong></li>
          <li>Connector receives code → exchanges token → MCP tools work</li>
        </ol>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
          Vercel Deployment Protection must be <strong>OFF</strong> or OAuth redirects fail.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>List fixed clients API</h2>
        <code className="mono" style={box}>
          GET {base}/oauth/register
        </code>
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
