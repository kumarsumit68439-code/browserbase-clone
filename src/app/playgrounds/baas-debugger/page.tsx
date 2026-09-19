"use client";

import { useState } from "react";
import Link from "next/link";

export default function BaasDebuggerPage() {
  const [apiKey, setApiKey] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const push = (line: string) => setLog((l) => [line, ...l].slice(0, 50));

  const listSessions = async () => {
    push("GET /api/v1/sessions …");
    const res = await fetch("/api/v1/sessions", {
      headers: apiKey
        ? { "x-bb-api-key": apiKey, Authorization: `Bearer ${apiKey}` }
        : {},
    });
    const data = await res.json();
    push(`${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  };

  const getSession = async () => {
    if (!sessionId) return push("Enter session id");
    push(`GET /api/v1/sessions/${sessionId} …`);
    const res = await fetch(`/api/v1/sessions/${sessionId}`, {
      headers: apiKey
        ? { "x-bb-api-key": apiKey, Authorization: `Bearer ${apiKey}` }
        : {},
    });
    const data = await res.json();
    push(`${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside style={{ width: 240, borderRight: "1px solid #27272a", background: "#09090b", padding: "1.25rem 0.75rem" }}>
        <Link href="/dashboard" style={{ fontWeight: 700, display: "block", marginBottom: 16, padding: "0 0.75rem" }}>BrowserBase</Link>
        <Link href="/playgrounds/baas-debugger" style={{ display: "block", padding: "0.45rem 0.75rem", background: "#27272a", borderRadius: 8, fontSize: "0.875rem" }}>BaaS Debugger</Link>
        <Link href="/playgrounds/rest" className="muted" style={{ display: "block", padding: "0.45rem 0.75rem", fontSize: "0.875rem" }}>REST Playground</Link>
      </aside>
      <main className="container" style={{ paddingTop: "1.75rem", flex: 1 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>BaaS Debugger</h1>
        <p className="muted" style={{ marginBottom: "1.25rem" }}>
          Inspect Browser-as-a-Service sessions with your API key
        </p>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key bb_..."
          style={field}
        />
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Session ID (optional)"
          style={field}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={listSessions}>List sessions</button>
          <button className="btn btn-white" onClick={getSession}>Get session</button>
        </div>
        <div className="card">
          <h2 style={{ fontSize: "0.9rem", marginBottom: 8 }}>Debug log</h2>
          {log.length === 0 ? (
            <p className="muted">No events yet</p>
          ) : (
            log.map((line, i) => (
              <pre key={i} className="mono" style={{ fontSize: "0.75rem", marginBottom: 8, whiteSpace: "pre-wrap" }}>
                {line}
              </pre>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "0.6rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
};
