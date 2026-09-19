"use client";

import { useState } from "react";
import Link from "next/link";

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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside
        style={{
          width: 240,
          borderRight: "1px solid #27272a",
          background: "#09090b",
          padding: "1.25rem 0.75rem",
        }}
      >
        <Link href="/dashboard" style={{ fontWeight: 700, display: "block", marginBottom: 16, padding: "0 0.75rem" }}>
          BrowserBase
        </Link>
        <Link href="/playgrounds/rest" style={{ display: "block", padding: "0.45rem 0.75rem", background: "#27272a", borderRadius: 8, fontSize: "0.875rem" }}>
          REST API Playground
        </Link>
        <Link href="/playgrounds/browserql" className="muted" style={{ display: "block", padding: "0.45rem 0.75rem", fontSize: "0.875rem" }}>
          BrowserQL Editor
        </Link>
        <Link href="/playgrounds/baas-debugger" className="muted" style={{ display: "block", padding: "0.45rem 0.75rem", fontSize: "0.875rem" }}>
          BaaS Debugger
        </Link>
        <Link href="/docs" className="muted" style={{ display: "block", padding: "0.45rem 0.75rem", fontSize: "0.875rem" }}>
          Docs
        </Link>
      </aside>
      <main className="container" style={{ paddingTop: "1.75rem", paddingBottom: "3rem", flex: 1 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>REST API Playground</h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          Live requests against your project using API Key + Project ID
        </p>

        <div className="grid-2" style={{ marginBottom: "1rem" }}>
          <div>
            <label className="muted" style={{ fontSize: "0.8rem" }}>API Key</label>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="bb_..."
              style={inputStyle}
            />
          </div>
          <div>
            <label className="muted" style={{ fontSize: "0.8rem" }}>Project ID</label>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="uuid project id"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ ...inputStyle, width: 120 }}>
            <option>GET</option>
            <option>POST</option>
            <option>DELETE</option>
          </select>
          <input value={path} onChange={(e) => setPath(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button className="btn btn-primary" onClick={run} disabled={loading}>
            {loading ? "Running…" : "Send"}
          </button>
        </div>

        {method !== "GET" && method !== "DELETE" && (
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={{ ...inputStyle, width: "100%", fontFamily: "monospace" }} />
        )}

        <div className="card" style={{ marginTop: "1rem" }}>
          <h2 style={{ fontSize: "0.9rem", marginBottom: 8 }}>Response</h2>
          <pre className="mono" style={{ whiteSpace: "pre-wrap", color: "#e4e4e7", fontSize: "0.8rem" }}>
            {result || "Send a request to see output"}
          </pre>
        </div>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "0.6rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
  fontSize: "0.875rem",
};
