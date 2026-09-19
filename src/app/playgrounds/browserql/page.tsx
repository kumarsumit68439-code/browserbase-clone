"use client";

import { useState } from "react";
import Link from "next/link";

export default function BrowserQLPage() {
  const [apiKey, setApiKey] = useState("");
  const [query, setQuery] = useState(`mutation CreateSession {
  createSession(region: "us-west-2", timeout: 300) {
    id
    status
    connectUrl
    region
  }
}`);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      // BrowserQL maps to REST sessions create for now
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey
            ? { "x-bb-api-key": apiKey, Authorization: `Bearer ${apiKey}` }
            : {}),
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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside style={{ width: 240, borderRight: "1px solid #27272a", background: "#09090b", padding: "1.25rem 0.75rem" }}>
        <Link href="/dashboard" style={{ fontWeight: 700, display: "block", marginBottom: 16, padding: "0 0.75rem" }}>BrowserBase</Link>
        <Link href="/playgrounds/browserql" style={{ display: "block", padding: "0.45rem 0.75rem", background: "#27272a", borderRadius: 8, fontSize: "0.875rem" }}>BrowserQL Editor</Link>
        <Link href="/playgrounds/rest" className="muted" style={{ display: "block", padding: "0.45rem 0.75rem", fontSize: "0.875rem" }}>REST API Playground</Link>
        <Link href="/docs" className="muted" style={{ display: "block", padding: "0.45rem 0.75rem", fontSize: "0.875rem" }}>Docs</Link>
      </aside>
      <main className="container" style={{ paddingTop: "1.75rem", flex: 1 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>BrowserQL Editor</h1>
        <p className="muted" style={{ marginBottom: "1.25rem" }}>
          GraphQL-style session control (executes against live Sessions API)
        </p>
        <label className="muted" style={{ fontSize: "0.8rem" }}>API Key</label>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="bb_..."
          style={{ display: "block", width: "100%", margin: "4px 0 12px", padding: "0.6rem", borderRadius: 8, border: "1px solid #27272a", background: "#09090b", color: "#fff" }}
        />
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={12}
          style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #27272a", background: "#09090b", color: "#e4e4e7", fontFamily: "monospace", fontSize: "0.85rem" }}
        />
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={run} disabled={loading}>
          {loading ? "Running…" : "Execute"}
        </button>
        <div className="card" style={{ marginTop: 16 }}>
          <pre className="mono" style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>{result || "Result will appear here"}</pre>
        </div>
      </main>
    </div>
  );
}
