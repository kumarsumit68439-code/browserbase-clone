"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function BrowserQLPage() {
  const [apiKey, setApiKey] = useState("");
  const [query, setQuery] = useState(`mutation CreateSession {
  createSession(region: "us-west-2", timeout: 300) {
    id
    status
    connectUrl
  }
}`);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-bb-api-key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ region: "us-west-2", timeout: 300 }),
      });
      const data = await res.json();
      setResult(JSON.stringify({ browserql: "mapped_to_rest", data }, null, 2));
    } catch (e: any) {
      setResult(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell active="/playgrounds/browserql">
      <h1 className="page-title">BrowserQL Editor</h1>
      <p className="page-sub">Runs against live Sessions API</p>
      <label className="muted" style={{ fontSize: "0.8rem" }}>API Key</label>
      <input
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="bb_..."
        style={field}
      />
      <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={10} style={{ ...field, fontFamily: "monospace" }} />
      <button className="btn btn-primary" onClick={run} disabled={loading} style={{ width: "100%", maxWidth: 280 }}>
        {loading ? "Running…" : "Execute"}
      </button>
      <div className="card" style={{ marginTop: 12 }}>
        <pre className="mono code-block" style={{ whiteSpace: "pre-wrap" }}>{result || "Result will appear here"}</pre>
      </div>
    </AppShell>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  marginBottom: 12,
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
  fontSize: "0.875rem",
};
