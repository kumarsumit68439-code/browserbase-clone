"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

type KeyRow = {
  id: string;
  full_key?: string;
  key_prefix?: string;
  name?: string;
  active?: boolean;
  created_at?: string;
  project_id?: string;
};

function maskKey(k?: string) {
  if (!k) return "—";
  if (k.length <= 16) return k.slice(0, 8) + "…";
  return k.slice(0, 12) + "…" + k.slice(-4);
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [projectId, setProjectId] = useState("");
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // Prefer backend keys list + workspace-style from dashboard data via sessions cookie
      const res = await fetch("/api/v1/backend/keys");
      const data = await res.json();
      if (res.ok) {
        setKeys(data.keys || []);
      }
      // Also try generic list from ensure path
      const r2 = await fetch("/api/v1/keys", { method: "GET" }).catch(() => null);
      if (r2 && r2.ok) {
        const d2 = await r2.json();
        if (d2.keys?.length) setKeys(d2.keys);
        if (d2.projectId) setProjectId(d2.projectId);
      }
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id: string) => {
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;
    const res = await fetch(`/api/v1/keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Revoke failed");
      return;
    }
    setMsg("Key revoked");
    await load();
  };

  const activate = async (id: string) => {
    const res = await fetch(`/api/v1/keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Activate failed");
      return;
    }
    setMsg("Key activated");
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this API key? This cannot be undone.")) return;
    const res = await fetch(`/api/v1/keys/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Delete failed");
      return;
    }
    setMsg("Key deleted");
    await load();
  };

  return (
    <AppShell active="/api-keys">
      <h1 className="page-title">API Keys</h1>
      <p className="page-sub">
        Private to your account · Revoke or delete anytime ·{" "}
        <Link href="/privacy" style={{ color: "#a78bfa" }}>
          Privacy
        </Link>
      </p>

      {msg && (
        <div className="card" style={{ marginBottom: 12, color: msg.includes("fail") ? "#fca5a5" : "#86efac" }}>
          {msg}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
          Project ID: <code className="mono">{projectId || keys[0]?.project_id || "—"}</code>
        </p>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !keys.length ? (
          <p className="muted">No keys yet. Open Dashboard once to auto-generate, or use Backend Keys.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr className="muted" style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
                  <th style={{ paddingBottom: 8 }}>Key</th>
                  <th style={{ paddingBottom: 8 }}>Status</th>
                  <th style={{ paddingBottom: 8 }}>Created</th>
                  <th style={{ paddingBottom: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: "1px solid #27272a" }}>
                    <td style={{ padding: "12px 0" }}>
                      <code className="mono" style={{ color: "#c4b5fd" }}>
                        {reveal[k.id] ? k.full_key : maskKey(k.full_key || k.key_prefix)}
                      </code>
                      <button
                        type="button"
                        className="btn btn-white"
                        style={{ marginLeft: 8, fontSize: "0.7rem", padding: "2px 8px" }}
                        onClick={() => setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))}
                      >
                        {reveal[k.id] ? "Hide" : "Show"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 0" }}>
                      <span className="badge">{k.active ? "Active" : "Revoked"}</span>
                    </td>
                    <td style={{ padding: "12px 0" }} className="muted">
                      {k.created_at ? new Date(k.created_at).toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "12px 0" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {k.active ? (
                          <button type="button" className="btn btn-white" style={{ fontSize: "0.75rem" }} onClick={() => revoke(k.id)}>
                            Revoke
                          </button>
                        ) : (
                          <button type="button" className="btn btn-white" style={{ fontSize: "0.75rem" }} onClick={() => activate(k.id)}>
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-white"
                          style={{ fontSize: "0.75rem", color: "#f87171" }}
                          onClick={() => remove(k.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Security</h2>
        <ul className="muted" style={{ fontSize: "0.8rem", paddingLeft: "1.1rem" }}>
          <li>Keys are private to your user account (RLS + server checks)</li>
          <li>Revoked keys cannot call APIs</li>
          <li>Never share keys in public repos or third-party sites</li>
          <li>
            See <Link href="/privacy" style={{ color: "#a78bfa" }}>Privacy Policy</Link> and{" "}
            <Link href="/terms" style={{ color: "#a78bfa" }}>Terms</Link>
          </li>
        </ul>
      </div>
    </AppShell>
  );
}
