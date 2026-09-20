"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default function DatabasePage() {
  const [collection, setCollection] = useState("demo");
  const [docs, setDocs] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backends, setBackends] = useState<{ supabase?: boolean; firebase?: boolean }>({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dRes, kRes, sRes] = await Promise.all([
        fetch("/api/v1/backend/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collection, action: "list", include_firebase: true }),
        }),
        fetch("/api/v1/backend/keys"),
        fetch("/api/v1/sessions").catch(() => null),
      ]);
      const d = await dRes.json();
      const k = await kRes.json();
      if (!dRes.ok) throw new Error(d.error || "Failed to load docs");
      setDocs(d.docs || []);
      setBackends(d.backends || {});
      setKeys(k.keys || []);
      if (sRes && sRes.ok) {
        const s = await sRes.json();
        setSessions(s.sessions || s.data || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [collection]);

  return (
    <AppShell active="/database">
      <h1 className="page-title">Realtime Database</h1>
      <p className="page-sub">
        Firebase-style data browser · Supabase {backends.supabase ? "✓" : ""}{" "}
        {backends.firebase ? "· Firebase ✓" : ""}
      </p>

      {error && (
        <div className="card" style={{ marginBottom: 12, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link href="/backend" className="btn btn-white">
          Backend Service
        </Link>
        <Link href="/sql-editor" className="btn btn-white">
          SQL Editor
        </Link>
        <Link href="/backend-keys" className="btn btn-white">
          Backend Keys
        </Link>
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Collections</h2>
          <input
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="collection name"
            style={field}
          />
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            Path: backend/{collection}
          </p>
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: "0.75rem", marginBottom: 6 }}>
              API keys ({keys.length})
            </div>
            <div className="muted" style={{ fontSize: "0.75rem", marginBottom: 6 }}>
              Sessions ({sessions.length})
            </div>
            <div className="muted" style={{ fontSize: "0.75rem" }}>
              Docs in collection ({docs.length})
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Data · {collection}</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : !docs.length ? (
            <p className="muted">Empty — insert from Backend Keys test or API</p>
          ) : (
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    border: "1px solid #27272a",
                    borderRadius: 8,
                    padding: "0.6rem",
                    marginBottom: 8,
                    background: "#09090b",
                  }}
                >
                  <code className="mono" style={{ color: "#c4b5fd", fontSize: "0.75rem" }}>
                    {doc.id}
                  </code>
                  <pre
                    className="mono"
                    style={{ fontSize: "0.7rem", marginTop: 6, whiteSpace: "pre-wrap", color: "#a1a1aa" }}
                  >
                    {JSON.stringify(doc.data ?? doc, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "0.55rem 0.7rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
};
