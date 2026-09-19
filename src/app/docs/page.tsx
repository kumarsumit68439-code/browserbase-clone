import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const { user, primaryKey, projectId } = await getWorkspace();
  const key = primaryKey || "bb_YOUR_API_KEY";
  const pid = projectId || "YOUR_PROJECT_ID";
  const base = "https://browserbase-clone-open-source1.vercel.app";

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/sessions",
      desc: "Create a real browser session (Browserless)",
      auth: "x-bb-api-key or Authorization: Bearer",
    },
    {
      method: "GET",
      path: "/api/v1/sessions",
      desc: "List sessions for the authenticated project/user",
      auth: "session cookie or API key",
    },
    {
      method: "GET",
      path: "/api/v1/sessions/:id",
      desc: "Get one session by id",
      auth: "session cookie or API key",
    },
    {
      method: "POST",
      path: "/auth/callback",
      desc: "OAuth callback (Google via Supabase)",
      auth: "OAuth",
    },
  ];

  return (
    <AppShell email={user.email} active="/docs">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>API Documentation</h1>
      <p className="muted" style={{ marginBottom: "1.75rem" }}>
        Authorize with your API key as Bearer token. Connected to Project{" "}
        <code className="mono">{pid}</code>
      </p>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>Authorize</h2>
        <p className="muted" style={{ fontSize: "0.875rem", marginBottom: 12 }}>
          Send your BrowserBase API key in either header:
        </p>
        <pre className="mono" style={codeBox}>{`Authorization: Bearer ${key}
x-bb-api-key: ${key}
x-bb-project-id: ${pid}`}</pre>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 10 }}>
          JWT style: use the same key as Bearer token. Optional custom JWT gateway can put{" "}
          <code>project_id</code> in claims.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>Endpoints</h2>
        <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
          <thead>
            <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
              <th style={{ paddingBottom: 8 }}>Method</th>
              <th style={{ paddingBottom: 8 }}>Path</th>
              <th style={{ paddingBottom: 8 }}>Description</th>
              <th style={{ paddingBottom: 8 }}>Auth</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((e) => (
              <tr key={e.method + e.path} style={{ borderBottom: "1px solid #27272a" }}>
                <td style={{ padding: "10px 0" }}>
                  <span className="badge">{e.method}</span>
                </td>
                <td style={{ padding: "10px 0", fontFamily: "monospace", color: "#c4b5fd" }}>{e.path}</td>
                <td style={{ padding: "10px 0" }} className="muted">
                  {e.desc}
                </td>
                <td style={{ padding: "10px 0", fontSize: "0.75rem" }} className="muted">
                  {e.auth}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Section title="cURL">
        {`curl -X POST ${base}/api/v1/sessions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${key}" \\
  -H "x-bb-api-key: ${key}" \\
  -d '{"region":"us-west-2","timeout":300}'`}
      </Section>

      <Section title="bash">
        {`export BB_API_KEY="${key}"
curl -s -X GET ${base}/api/v1/sessions \\
  -H "Authorization: Bearer $BB_API_KEY" | jq .`}
      </Section>

      <Section title="JSON API (request)">
        {JSON.stringify(
          { region: "us-west-2", timeout: 300, keepAlive: false },
          null,
          2
        )}
      </Section>

      <Section title="JSON API (response shape)">
        {JSON.stringify(
          {
            id: "sess_...",
            projectId: pid,
            status: "RUNNING",
            connectUrl: "wss://...browserless.io/...",
            region: "us-west-2",
            provider: "browserless",
          },
          null,
          2
        )}
      </Section>

      <Section title="React / fetch">
        {`await fetch("${base}/api/v1/sessions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${key}",
    "x-bb-api-key": "${key}",
  },
  body: JSON.stringify({ region: "us-west-2" }),
}).then(r => r.json())`}
      </Section>

      <Section title="FastAPI">
        {`import httpx
from fastapi import FastAPI

app = FastAPI()

@app.post("/session")
async def create():
    async with httpx.AsyncClient() as c:
        r = await c.post(
            "${base}/api/v1/sessions",
            headers={"Authorization": "Bearer ${key}"},
            json={"region": "us-west-2"},
        )
        return r.json()`}
      </Section>

      <Section title="JWT notes">
        {`# BrowserBase API keys work as opaque Bearer tokens.
# If you put a JWT gateway in front:
#   Authorization: Bearer <jwt>
# Map jwt.sub or jwt.project_id -> x-bb-project-id
# Validate scope: sessions:read | sessions:write`}
      </Section>

      <Section title="Slack">
        {`# Notify Slack when a session starts
curl -X POST $SLACK_WEBHOOK \\
  -H "Content-Type: application/json" \\
  -d '{"text":"BrowserBase session started for project ${pid}"}'`}
      </Section>

      <Section title="SaaS / BaaS">
        {`// Per-tenant BaaS: bind projectId + API key server-side
headers: {
  "Authorization": "Bearer ${key}",
  "x-bb-project-id": "${pid}",
}
// Never expose service role keys to the browser.`}
      </Section>

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/playgrounds/rest" style={{ color: "#a78bfa" }}>
          Try in REST API Playground →
        </Link>
        {" · "}
        <Link href="/tools/code-generator" style={{ color: "#a78bfa" }}>
          Code Generator →
        </Link>
      </p>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{title}</h2>
      <pre className="mono" style={codeBox}>
        {children}
      </pre>
    </div>
  );
}

const codeBox: React.CSSProperties = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "1rem",
  overflow: "auto",
  fontSize: "0.78rem",
  color: "#e4e4e7",
  whiteSpace: "pre-wrap",
};
