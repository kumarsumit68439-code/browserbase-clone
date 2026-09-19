"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function BaasDebuggerPage() {
  const [apiKey, setApiKey] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const push = (line: string) => setLog((l) => [line, ...l].slice(0, 50));

  const listSessions = async () => {
    push("GET /api/v1/sessions …");
    const res = await fetch("/api/v1/sessions", {
      headers: apiKey ? { "x-bb-api-key": apiKey, Authorization: `Bearer ${apiKey}` } : {},
    });
    const data = await res.json();
    push(`${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  };

  const getSession = async () => {
    if (!sessionId) return push("Enter session id");
    push(`GET /api/v1/sessions/${sessionId} …`);
    const res = await fetch(`/api/v1/sessions/${sessionId}`, {
      headers: apiKey ? { "x-bb-api-key": apiKey, Authorization: `Bearer ${apiKey}` } : {},
    });
    const data = await res.json();
    push(`${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  };

  return (
    <AppShell active="/playgrounds/baas-debugger">
      <h1 className="page-title">BaaS Debugger</h1>
      <p className="page-sub">Inspect sessions with your API key</p>
      <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key bb_..." style={field} />
      <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session ID (optional)" style={field} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={listSessions} style={{ flex: "1 1 140px" }}>List sessions</button>
        <button className="btn btn-white" onClick={getSession} style={{ flex: "1 1 140px" }}>Get session</button>
      </div>
      <div className="card">
        <h2 style={{ fontSize: "0.9rem", marginBottom: 8 }}>Debug log</h2>
        {log.length === 0 ? (
          <p className="muted">No events yet</p>
        ) : (
          log.map((line, i) => (
            <pre key={i} className="mono code-block" style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
              {line}
            </pre>
          ))
        )}
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
