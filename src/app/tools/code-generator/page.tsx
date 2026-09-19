import { AppShell } from "@/components/AppShell";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function CodeGeneratorPage() {
  const { user, primaryKey, projectId } = await getWorkspace();
  const key = primaryKey || "bb_YOUR_API_KEY";
  const pid = projectId || "YOUR_PROJECT_ID";
  const base = "https://browserbase-clone-open-source1.vercel.app";

  const snippets: { title: string; code: string }[] = [
    {
      title: "cURL",
      code: `curl -X POST ${base}/api/v1/sessions \\\n  -H "Content-Type: application/json" \\\n  -H "x-bb-api-key: ${key}" \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "x-bb-project-id: ${pid}" \\\n  -d '{"region":"us-west-2","timeout":300}'`,
    },
    {
      title: "bash",
      code: `export BB_API_KEY="${key}"
export BB_PROJECT_ID="${pid}"
curl -s -X POST ${base}/api/v1/sessions \\\n  -H "x-bb-api-key: $BB_API_KEY" \\\n  -H "Authorization: Bearer $BB_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"region":"us-west-2"}' | jq .`,
    },
    {
      title: "JavaScript / React",
      code: `const res = await fetch("${base}/api/v1/sessions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-bb-api-key": "${key}",
    "Authorization": "Bearer ${key}",
    "x-bb-project-id": "${pid}",
  },
  body: JSON.stringify({ region: "us-west-2", timeout: 300 }),
});
const session = await res.json();
console.log(session.connectUrl);`,
    },
    {
      title: "JSON (request body)",
      code: JSON.stringify(
        {
          region: "us-west-2",
          timeout: 300,
          keepAlive: false,
          userMetadata: { source: "code-generator" },
        },
        null,
        2
      ),
    },
    {
      title: "FastAPI (Python)",
      code: `import httpx
from fastapi import FastAPI

app = FastAPI()
BB_API_KEY = "${key}"
BASE = "${base}"

@app.post("/start-browser")
async def start_browser():
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{BASE}/api/v1/sessions",
            headers={
                "x-bb-api-key": BB_API_KEY,
                "Authorization": f"Bearer {BB_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"region": "us-west-2", "timeout": 300},
        )
        return r.json()`,
    },
    {
      title: "JWT / Bearer token style",
      code: `# Treat your BrowserBase API key as a Bearer token
Authorization: Bearer ${key}
x-bb-api-key: ${key}
x-bb-project-id: ${pid}

# Example JWT claim payload (if you mint your own JWT gateway):
{
  "sub": "${pid}",
  "scope": "sessions:write sessions:read",
  "iss": "browserbase-clone"
}`,
    },
    {
      title: "Slack webhook helper",
      code: `# After creating a session, post connectUrl to Slack
SESSION=$(curl -s -X POST ${base}/api/v1/sessions \\\n  -H "x-bb-api-key: ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"region":"us-west-2"}')

curl -X POST $SLACK_WEBHOOK_URL \\\n  -H "Content-Type: application/json" \\\n  -d "{\"text\":\"New BB session: $SESSION\"}"`,
    },
    {
      title: "SaaS / BaaS integration",
      code: `// Multi-tenant SaaS: store projectId per customer
const customerProjectId = "${pid}";
const apiKey = process.env.BB_API_KEY; // ${key.slice(0, 12)}...

export async function provisionBrowserForTenant(tenantId: string) {
  const res = await fetch("${base}/api/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bb-api-key": apiKey!,
      "Authorization": \`Bearer \${apiKey}\`,
      "x-bb-project-id": customerProjectId,
    },
    body: JSON.stringify({
      region: "us-west-2",
      userMetadata: { tenantId, product: "baas" },
    }),
  });
  return res.json();
}`,
    },
  ];

  return (
    <AppShell email={user.email} active="/tools/code-generator">
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Code Generator</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Ready-to-run snippets using your real Project ID and API Key
      </p>
      {snippets.map((s) => (
        <div key={s.title} className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{s.title}</h2>
          <pre
            className="mono"
            style={{
              background: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: "1rem",
              overflow: "auto",
              fontSize: "0.78rem",
              color: "#e4e4e7",
              whiteSpace: "pre-wrap",
            }}
          >
            {s.code}
          </pre>
        </div>
      ))}
    </AppShell>
  );
}
