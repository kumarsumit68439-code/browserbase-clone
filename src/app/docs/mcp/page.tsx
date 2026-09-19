import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function McpDocsPage() {
  const { user } = await getWorkspace();
  const base = "https://browserbase-clone-open-source1.vercel.app";

  return (
    <AppShell email={user.email} active="/docs/mcp">
      <h1 className="page-title">MCP Connect · PKCE OAuth</h1>
      <p className="page-sub">Real authorization code + PKCE (S256) · MCP tools after Bearer token</p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>MCP Server URL</h2>
        <code className="mono" style={box}>
          {base}/api/mcp
        </code>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Custom Connector (PKCE)</h2>
        <pre className="mono code-block" style={box}>{`Client ID:                 chatgpt   (or claude / cursor / grok …)
Client Secret:             (leave empty)
Authorization Endpoint:    ${base}/oauth/authorize
Token Endpoint:            ${base}/oauth/token
Scopes:                    mcp
Token Auth Method:         none (PKCE only)

Discovery:
${base}/.well-known/oauth-authorization-server
${base}/.well-known/oauth-protected-resource`}</pre>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>PKCE flow</h2>
        <ol className="muted" style={{ paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
          <li>Client creates code_verifier + code_challenge = S256(verifier)</li>
          <li>
            GET /oauth/authorize?response_type=code&amp;client_id=…&amp;redirect_uri=…&amp;code_challenge=…&amp;code_challenge_method=S256&amp;scope=mcp&amp;state=…
          </li>
          <li>You login (Google) → Approve screen</li>
          <li>Redirect: redirect_uri?code=…&amp;state=…</li>
          <li>
            POST /oauth/token with grant_type=authorization_code, code, redirect_uri, code_verifier, client_id
          </li>
          <li>Use access_token: Authorization: Bearer … on {base}/api/mcp</li>
        </ol>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Important</h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Vercel → Project → Settings → <strong>Deployment Protection</strong> must be{" "}
          <strong>Disabled</strong> for production, or OAuth/MCP will redirect to Vercel login (405 / blocked).
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>MCP tools after OAuth</h2>
        <ul className="muted" style={{ paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
          <li>get_workspace, get_api_keys</li>
          <li>list_sessions, get_session, create_session</li>
          <li>get_docs, list_pages</li>
        </ul>
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
