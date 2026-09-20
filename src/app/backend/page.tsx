"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default function BackendServicePage() {
  const [stats, setStats] = useState({
    keys: 0,
    docs: 0,
    sessions: 0,
    firebase: false,
    supabase: true,
  });
  const [keys, setKeys] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [kRes, dRes] = await Promise.all([
          fetch("/api/v1/backend/keys"),
          fetch("/api/v1/backend/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collection: "demo", action: "list" }),
          }),
        ]);
        const k = await kRes.json();
        const d = await dRes.json();
        if (!kRes.ok) throw new Error(k.error || "keys failed");
        setKeys(k.keys || []);
        setDocs(d.docs || []);
        setStats({
          keys: (k.keys || []).length,
          docs: (d.docs || []).length,
          sessions: 0,
          firebase: Boolean(d.backends?.firebase),
          supabase: d.backends?.supabase !== false,
        });
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <AppShell active="/backend">
      <h1 className="page-title">Backend Service</h1>
      <p className="page-sub">Users data · API keys · endpoints · SQL & Database linked</p>

      {error && (
        <div className="card" style={{ marginBottom: 12, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: "1rem",
        }}
      >
        {[
          { label: "API Keys", value: stats.keys },
          { label: "Docs (demo)", value: stats.docs },
          { label: "Supabase", value: stats.supabase ? "ON" : "OFF" },
          { label: "Firebase", value: stats.firebase ? "ON" : "OFF" },
        ].map((c) => (
          <div key={c.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{c.value}</div>
            <div className="muted" style={{ fontSize: "0.75rem" }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/backend-keys" className="btn btn-primary">
          Backend Keys
        </Link>
        <Link href="/database" className="btn btn-white">
          Real Database
        </Link>
        <Link href="/sql-editor" className="btn btn-white">
          SQL Editor / CLI
        </Link>
        <Link href="/ai-keys" className="btn btn-white">
          AI API Keys
        </Link>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Your backend keys</h2>
        {!keys.length ? (
          <p className="muted">No keys — generate on Backend Keys page</p>
        ) : (
          <ul style={{ fontSize: "0.85rem" }}>
            {keys.map((k) => (
              <li key={k.id} style={{ marginBottom: 6 }}>
                <strong>{k.name}</strong>{" "}
                <code className="mono" style={{ color: "#c4b5fd", fontSize: "0.75rem" }}>
                  {k.full_key}
                </code>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Recent docs</h2>
        {!docs.length ? (
          <p className="muted">Empty</p>
        ) : (
          <pre className="mono" style={{ fontSize: "0.75rem", whiteSpace: "pre-wrap", color: "#a1a1aa" }}>
            {JSON.stringify(docs.slice(0, 5), null, 2)}
          </pre>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Endpoints</h2>
        <pre className="mono" style={code}>{`POST ${base}/api/v1/backend/keys
POST ${base}/api/v1/backend/data
POST ${base}/api/v1/backend/sql          # SQL editor + AI
POST ${base}/api/v1/langgraph/run
POST ${base}/api/v1/ai/chat`}</pre>
      </div>
    </AppShell>
  );
}

const code: React.CSSProperties = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "0.75rem",
  color: "#c4b5fd",
  fontSize: "0.75rem",
  whiteSpace: "pre-wrap",
};
