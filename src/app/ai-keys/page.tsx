"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type KeyRow = {
  id: string;
  full_key: string;
  key_prefix?: string;
  name?: string;
  active?: boolean;
  created_at?: string;
  project_id?: string;
};

export default function AiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [name, setName] = useState("AI Response Key");
  const [testMsg, setTestMsg] = useState("Say hello in one sentence.");
  const [testOut, setTestOut] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const base =
    typeof window !== "undefined" ? window.location.origin : "https://browserbase-clone-open-source1.vercel.app";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/ai/keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load keys");
      setKeys(data.keys || []);
    } catch (e: any) {
      setError(e.message || "Load failed — login required");
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
      const res = await fetch("/api/v1/ai/keys", {
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

  const testChat = async () => {
    const key = newKey || keys.find((k) => k.full_key?.startsWith("bb_ai_"))?.full_key || keys[0]?.full_key;
    if (!key) {
      setError("Generate a key first");
      return;
    }
    setTesting(true);
    setTestOut("");
    setError("");
    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "x-bb-api-key": key,
        },
        body: JSON.stringify({ message: testMsg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.hint || "Chat failed");
      setTestOut(
        data.choices?.[0]?.message?.content ||
          JSON.stringify(data, null, 2)
      );
    } catch (e: any) {
      setTestOut("");
      setError(e.message);
    } finally {
      setTesting(false);
    }
  };

  const sampleKey = newKey || "bb_ai_YOUR_KEY";

  return (
    <AppShell active="/ai-keys">
      <h1 className="page-title">AI API Keys</h1>
      <p className="page-sub">
        Real AI response keys · open-source models (Groq/OpenRouter Llama) · backend + Supabase
      </p>

      {error && (
        <div className="card" style={{ marginBottom: 12, borderColor: "#7f1d1d", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Generate AI API Key</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name"
          style={field}
        />
        <button className="btn btn-primary" onClick={createKey} disabled={creating}>
          {creating ? "Generating…" : "Generate real AI API key"}
        </button>
        {newKey && (
          <div style={{ marginTop: 12 }}>
            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 6 }}>
              Copy now — this is your real key:
            </p>
            <code className="mono" style={codeBox}>
              {newKey}
            </code>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Your keys (database)</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !keys.length ? (
          <p className="muted">No keys yet. Generate one above.</p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
                  <th style={{ paddingBottom: 8 }}>Name</th>
                  <th style={{ paddingBottom: 8 }}>Key</th>
                  <th style={{ paddingBottom: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: "1px solid #27272a" }}>
                    <td style={{ padding: "10px 0" }}>{k.name || "—"}</td>
                    <td style={{ padding: "10px 0" }}>
                      <code className="mono" style={{ color: "#c4b5fd", fontSize: "0.75rem" }}>
                        {k.full_key}
                      </code>
                    </td>
                    <td style={{ padding: "10px 0" }}>
                      <span className="badge">{k.active ? "Active" : "Off"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Test real AI response</h2>
        <textarea value={testMsg} onChange={(e) => setTestMsg(e.target.value)} rows={2} style={{ ...field, fontFamily: "inherit" }} />
        <button className="btn btn-white" onClick={testChat} disabled={testing}>
          {testing ? "Calling server…" : "POST /api/v1/ai/chat"}
        </button>
        {testOut && (
          <pre className="mono code-block" style={{ ...codeBox, marginTop: 12, whiteSpace: "pre-wrap" }}>
            {testOut}
          </pre>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Token · endpoints · scripts</h2>
        <pre className="mono code-block" style={codeBox}>{`# Auth headers
Authorization: Bearer ${sampleKey}
x-bb-api-key: ${sampleKey}

# Create AI key
curl -X POST ${base}/api/v1/ai/keys \\
  -H "Content-Type: application/json" \\
  -H "Cookie: <session>" \\
  -d '{"name":"AI Response Key"}'

# Real AI chat (open-source model on server)
curl -X POST ${base}/api/v1/ai/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -d '{"message":"Explain cloud browser sessions"}'

# Full messages array
curl -X POST ${base}/api/v1/ai/chat \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role":"system","content":"You are a browser agent"},
      {"role":"user","content":"List steps to create a session"}
    ]
  }'`}</pre>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Server env (Vercel)</h2>
        <pre className="mono code-block" style={codeBox}>{`GROQ_API_KEY=gsk_...     # free open Llama models — console.groq.com
# or
OPENROUTER_API_KEY=...
# optional
AI_MODEL=llama-3.3-70b-versatile`}</pre>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          Keys are stored in Supabase <code>bb_api_keys</code>. Chat runs on your backend, not in the browser.
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
  display: "block",
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "0.75rem",
  color: "#c4b5fd",
  overflow: "auto",
};
