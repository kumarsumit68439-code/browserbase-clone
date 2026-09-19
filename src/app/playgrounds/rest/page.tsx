"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function RestPlaygroundPage() {
  const [apiKey, setApiKey] = useState("");
  const [projectId, setProjectId] = useState("");
  const [method, setMethod] = useState("POST");
  const [path, setPath] = useState("/api/v1/sessions");
  const [body, setBody] = useState('{\n  "region": "us-west-2",\n  "timeout": 300\n}');
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-bb-api-key"] = apiKey;
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      if (projectId) headers["x-bb-project-id"] = projectId;
      const res = await fetch(path, {
        method,
        headers,
        body: method === "GET" || method === "DELETE" ? undefined : body,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setResult(`${res.status} ${res.statusText}\n\n${pretty}`);
    } catch (e: any) {
      setResult(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell active="/playgrounds/rest">
      <h1 className="page-title">REST API Playground</h1>
      <p className="page-sub">Live requests with API Key + Project ID</p>

      <div className="grid-2" style={{ marginBottom: "0.75rem" }}>
        <div>
          <label className="muted" style={{ fontSize: "0.8rem" }}>API Key</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="bb_..." style={field} />
        </div>
        <div>
          <label className="muted" style={{ fontSize: "0.8rem" }}>Project ID</label>
          <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="project uuid" style={field} />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "0.75rem" }}>
        <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ ...field, width: 110, marginBottom: 0 }}>
          <option>GET</option>
          <option>POST</option>
          <option>DELETE</option>
        </select>
        <input value={path} onChange={(e) => setPath(e.target.value)} style={{ ...field, flex: "1 1 160px", marginBottom: 0, minWidth: 0 }} />
        <button className="btn btn-primary" onClick={run} disabled={loading} style={{ flex: "1 1 auto" }}>
          {loading ? "Running…" : "Send"}
        </button>
      </div>

      {method !== "GET" && method !== "DELETE" && (
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={{ ...field, width: "100%", fontFamily: "monospace" }} />
      )}

      <div className="card" style={{ marginTop: "0.75rem" }}>
        <h2 style={{ fontSize: "0.9rem", marginBottom: 8 }}>Response</h2>
        <pre className="mono code-block" style={{ whiteSpace: "pre-wrap", color: "#e4e4e7" }}>
          {result || "Send a request to see output"}
        </pre>
      </div>
    </AppShell>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  marginBottom: 8,
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
  fontSize: "0.875rem",
};
