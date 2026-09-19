"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type KeyRow = {
  id: string;
  full_key: string;
  name?: string;
  active?: boolean;
  created_at?: string;
};

export default function BackendKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [name, setName] = useState("Backend API Key");
  const [error, setError] = useState("");
  const [testOut, setTestOut] = useState("");

  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://browserbase-clone-open-source1.vercel.app";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backend/keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setKeys(data.keys || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createKey = async () => {
    setCreating(true);
    setError("");
    setNewKey(null);
    try {
      const res = await fetch("/api/v1/backend/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setNewKey(data.key?.full_key || null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const testInsert = async () => {
    const key =
      newKey ||
      keys.find((k) => k.full_key?.startsWith("bb_backend_"))?.full_key ||
      keys[0]?.full_key;
    if (!key) {
      setError("Generate a backend key first");
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/v1/backend/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          collection: "demo",
          action: "insert",
          data: { hello: "from backend API", at: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      setTestOut(JSON.stringify(data, null, 2));
      if (!res.ok) setError(data.error || "Test failed");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const sample = newKey || "bb_backend_YOUR_KEY";

  return (
    <AppShell active="/backend-keys">
      <h1 className="page-title">Backend API Keys</h1>
      <p className="page-sub">
        Real backend for any website · Supabase DB · optional Firebase · LangGraph agent API
      </p>

      {error && (
        <div className="card" style={{ marginBottom: 12, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Generate Backend Key</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} style={field} />
        <button className="btn btn-primary" onClick={createKey} disabled={creating}>
          {creating ? "Generating…" : "Generate backend API key"}
        </button>
        {newKey && (
          <code className="mono" style={{ ...codeBox, display: "block", marginTop: 12 }}>
            {newKey}
          </code>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Keys (database)</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <ul className="muted" style={{ fontSize: "0.85rem" }}>
            {keys.map((k) => (
              <li key={k.id} style={{ marginBottom: 6 }}>
                <strong style={{ color: "#fff" }}>{k.name}</strong> ·{" "}
                <code className="mono" style={{ color: "#c4b5fd" }}>
                  {k.full_key}
                </code>
              </li>
            ))}
          </ul>
        )}
        <button className="btn btn-white" onClick={testInsert} style={{ marginTop: 8 }}>
          Test insert → /api/v1/backend/data
        </button>
        {testOut && (
          <pre className="mono" style={{ ...codeBox, marginTop: 12, whiteSpace: "pre-wrap" }}>
            {testOut}
          </pre>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>
          Endpoints (any website / localhost)
        </h2>
        <pre className="mono" style={codeBox}>{`# Backend data (Supabase)
curl -X POST ${base}/api/v1/backend/data \\
  -H "Authorization: Bearer ${sample}" \\
  -H "Content-Type: application/json" \\
  -d '{"collection":"users","action":"insert","data":{"email":"a@b.com"}}'

# List
curl "${base}/api/v1/backend/data?collection=users" \\
  -H "Authorization: Bearer ${sample}"

# LangGraph agent (plan → act → reflect)
curl -X POST ${base}/api/v1/langgraph/run \\
  -H "Authorization: Bearer ${sample}" \\
  -H "Content-Type: application/json" \\
  -d '{"input":"Write a welcome email","model":"openrouter/free"}'`}</pre>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Supabase table (run once)</h2>
        <pre className="mono" style={codeBox}>{`create table if not exists bb_backend_docs (
  id text primary key,
  user_id uuid not null,
  project_id text,
  collection text not null,
  data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);`}</pre>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Firebase optional: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
        </p>
      </div>
    </AppShell>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
};

const codeBox: React.CSSProperties = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "0.75rem",
  color: "#c4b5fd",
  overflow: "auto",
  fontSize: "0.75rem",
};
