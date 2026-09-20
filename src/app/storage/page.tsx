"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default function StoragePage() {
  const [bucket, setBucket] = useState("default");
  const [objects, setObjects] = useState<any[]>([]);
  const [name, setName] = useState("note.json");
  const [content, setContent] = useState('{"hello": "storage"}');
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/backend/storage?bucket=${encodeURIComponent(bucket)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setObjects(data.objects || []);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bucket]);

  const upload = async () => {
    setLoading(true);
    setMsg("");
    try {
      let parsed: any = content;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { text: content };
      }
      const res = await fetch("/api/v1/backend/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, name, content: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("Uploaded");
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/v1/backend/storage?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  return (
    <AppShell active="/storage">
      <h1 className="page-title">Storage</h1>
      <p className="page-sub">Database-backed object storage · connected to backend</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/database" className="btn btn-white">
          Database
        </Link>
        <Link href="/database/tables" className="btn btn-white">
          Table Editor
        </Link>
        <Link href="/sql-editor" className="btn btn-white">
          SQL Editor
        </Link>
        <Link href="/backend" className="btn btn-white">
          Backend
        </Link>
      </div>

      {msg && (
        <div className="card" style={{ marginBottom: 12, color: msg === "Uploaded" ? "#86efac" : "#fca5a5" }}>
          {msg}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Upload</h2>
          <label className="muted" style={{ fontSize: "0.75rem" }}>Bucket</label>
          <input value={bucket} onChange={(e) => setBucket(e.target.value)} style={field} />
          <label className="muted" style={{ fontSize: "0.75rem" }}>File name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={field} />
          <label className="muted" style={{ fontSize: "0.75rem" }}>JSON / text content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} style={field} />
          <button className="btn btn-primary" onClick={upload} disabled={loading}>
            Save to storage
          </button>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>
            Objects · {bucket} {loading ? "…" : `(${objects.length})`}
          </h2>
          {!objects.length ? (
            <p className="muted">Empty bucket</p>
          ) : (
            <ul style={{ fontSize: "0.85rem" }}>
              {objects.map((o) => (
                <li
                  key={o.id}
                  style={{
                    marginBottom: 10,
                    borderBottom: "1px solid #27272a",
                    paddingBottom: 8,
                  }}
                >
                  <strong style={{ color: "#fff" }}>{o.name}</strong>
                  <div className="muted" style={{ fontSize: "0.75rem" }}>
                    {o.path} · {o.size_bytes}b
                  </div>
                  <pre
                    className="mono"
                    style={{ fontSize: "0.7rem", color: "#a1a1aa", whiteSpace: "pre-wrap", marginTop: 4 }}
                  >
                    {JSON.stringify(o.data, null, 2)}
                  </pre>
                  <button type="button" className="btn btn-white" style={{ marginTop: 4 }} onClick={() => remove(o.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
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
  fontSize: "0.85rem",
};
