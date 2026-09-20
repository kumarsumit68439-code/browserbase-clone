"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

type RtProject = {
  id: string;
  name: string;
  project_id: string;
  api_key: string;
  database_url: string;
  messaging_sender_id?: string;
  app_id?: string;
  client_id: string;
  client_secret: string;
  measurement_id?: string;
};

const DEFAULT_RULES = `{
  "rules": {
    ".read": true,
    ".write": true,
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}`;

export default function RealtimeDatabasePage() {
  const [projects, setProjects] = useState<RtProject[]>([]);
  const [selected, setSelected] = useState<RtProject | null>(null);
  const [tab, setTab] = useState<"data" | "rules" | "config">("data");
  const [rulesText, setRulesText] = useState(DEFAULT_RULES);
  const [path, setPath] = useState("/");
  const [valueJson, setValueJson] = useState('{"hello": "world"}');
  const [nodes, setNodes] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("My Realtime App");

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/v1/realtime/projects");
    const data = await res.json();
    if (res.ok) {
      setProjects(data.projects || []);
      if (!selected && data.projects?.[0]) setSelected(data.projects[0]);
    }
  }, [selected]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadRules = async (p: RtProject) => {
    const res = await fetch(`/api/v1/realtime/rules?project=${encodeURIComponent(p.project_id)}`);
    const data = await res.json();
    if (res.ok && data.rules) {
      setRulesText(JSON.stringify(data.rules, null, 2));
    }
  };

  const loadData = async (p: RtProject, pathArg = path) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/realtime/data?project=${encodeURIComponent(p.project_id)}&path=${encodeURIComponent(pathArg)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNodes(data.nodes || []);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) {
      loadRules(selected);
      loadData(selected);
      const t = setInterval(() => loadData(selected), 4000);
      return () => clearInterval(t);
    }
  }, [selected?.project_id]);

  const createProject = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/v1/realtime/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Project created: ${data.project.project_id}`);
      await loadProjects();
      setSelected(data.project);
      setTab("config");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const publishRules = async () => {
    if (!selected) return;
    setLoading(true);
    setMsg("");
    try {
      JSON.parse(rulesText); // validate
      const res = await fetch("/api/v1/realtime/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: selected.project_id, rules_text: rulesText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("Rules published");
    } catch (e: any) {
      setMsg(e.message.includes("JSON") ? "Expected valid JSON rules" : e.message);
    } finally {
      setLoading(false);
    }
  };

  const writePath = async () => {
    if (!selected) return;
    setLoading(true);
    setMsg("");
    try {
      let value: any;
      try {
        value = JSON.parse(valueJson);
      } catch {
        value = valueJson;
      }
      const res = await fetch("/api/v1/realtime/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: selected.project_id, path, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Written ${path}`);
      await loadData(selected);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePath = async (p: string) => {
    if (!selected) return;
    await fetch(
      `/api/v1/realtime/data?project=${encodeURIComponent(selected.project_id)}&path=${encodeURIComponent(p)}`,
      { method: "DELETE" }
    );
    await loadData(selected);
  };

  return (
    <AppShell active="/database">
      <h1 className="page-title">Realtime Database</h1>
      <p className="page-sub">Firebase-style · projects · rules · live data · client credentials</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/database/tables" className="btn btn-white">Table Editor</Link>
        <Link href="/sql-editor" className="btn btn-white">SQL Editor</Link>
        <Link href="/storage" className="btn btn-white">Storage</Link>
        <Link href="/backend" className="btn btn-white">Backend</Link>
      </div>

      {msg && (
        <div
          className="card"
          style={{
            marginBottom: 12,
            color: msg.includes("published") || msg.includes("created") || msg.includes("Written") ? "#86efac" : "#fca5a5",
          }}
        >
          {msg}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Projects</h2>
          <ul style={{ fontSize: "0.85rem", marginBottom: 12, maxHeight: 200, overflowY: "auto" }}>
            {projects.map((p) => (
              <li key={p.id} style={{ marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: selected?.id === p.id ? "#27272a" : "transparent",
                    border: "none",
                    color: "#e4e4e7",
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ fontSize: "0.7rem", fontFamily: "monospace" }}>
                    {p.project_id}
                  </div>
                </button>
              </li>
            ))}
            {!projects.length && <li className="muted">No projects yet</li>}
          </ul>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} style={field} />
          <button className="btn btn-primary" onClick={createProject} disabled={loading}>
            Create project
          </button>
        </div>

        <div className="card">
          {!selected ? (
            <p className="muted">Create or select a project</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {(["data", "rules", "config"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={tab === t ? "btn btn-primary" : "btn btn-white"}
                    onClick={() => setTab(t)}
                  >
                    {t === "data" ? "Data" : t === "rules" ? "Rules" : "Config"}
                  </button>
                ))}
              </div>

              {tab === "config" && (
                <div style={{ fontSize: "0.8rem" }}>
                  <ConfigRow label="Project ID" value={selected.project_id} />
                  <ConfigRow label="API Key" value={selected.api_key} />
                  <ConfigRow label="Database URL" value={selected.database_url} />
                  <ConfigRow label="Messaging Sender ID" value={selected.messaging_sender_id || ""} />
                  <ConfigRow label="App ID" value={selected.app_id || ""} />
                  <ConfigRow label="Measurement ID" value={selected.measurement_id || ""} />
                  <ConfigRow label="Client ID" value={selected.client_id} />
                  <ConfigRow label="Client Secret" value={selected.client_secret} />
                  <pre className="mono" style={{ ...code, marginTop: 12 }}>{`const firebaseConfig = {
  apiKey: "${selected.api_key}",
  projectId: "${selected.project_id}",
  databaseURL: "${selected.database_url}",
  messagingSenderId: "${selected.messaging_sender_id}",
  appId: "${selected.app_id}",
  measurementId: "${selected.measurement_id}",
  clientId: "${selected.client_id}",
  clientSecret: "${selected.client_secret}"
};`}</pre>
                </div>
              )}

              {tab === "rules" && (
                <>
                  <textarea
                    value={rulesText}
                    onChange={(e) => setRulesText(e.target.value)}
                    rows={14}
                    style={{ ...field, fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}
                  />
                  <button className="btn btn-primary" onClick={publishRules} disabled={loading}>
                    Publish rules
                  </button>
                </>
              )}

              {tab === "data" && (
                <>
                  <label className="muted" style={{ fontSize: "0.75rem" }}>Path</label>
                  <input value={path} onChange={(e) => setPath(e.target.value)} style={field} placeholder="/users/uid1" />
                  <label className="muted" style={{ fontSize: "0.75rem" }}>Value (JSON)</label>
                  <textarea value={valueJson} onChange={(e) => setValueJson(e.target.value)} rows={4} style={field} />
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button className="btn btn-primary" onClick={writePath} disabled={loading}>
                      Set / update
                    </button>
                    <button className="btn btn-white" onClick={() => selected && loadData(selected)} disabled={loading}>
                      Refresh
                    </button>
                  </div>
                  <p className="muted" style={{ fontSize: "0.75rem", marginBottom: 8 }}>
                    Live poll every 4s · {nodes.length} nodes
                  </p>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {nodes.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          border: "1px solid #27272a",
                          borderRadius: 8,
                          padding: 8,
                          marginBottom: 8,
                          background: "#09090b",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <code className="mono" style={{ color: "#c4b5fd", fontSize: "0.75rem" }}>
                            {n.path}
                          </code>
                          <button type="button" className="btn btn-white" style={{ fontSize: "0.7rem" }} onClick={() => deletePath(n.path)}>
                            Delete
                          </button>
                        </div>
                        <pre className="mono" style={{ fontSize: "0.7rem", color: "#a1a1aa", marginTop: 4, whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(n.value, null, 2)}
                        </pre>
                      </div>
                    ))}
                    {!nodes.length && <p className="muted">Empty — write a path</p>}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="muted" style={{ fontSize: "0.7rem" }}>
        {label}
      </div>
      <code className="mono" style={{ color: "#c4b5fd", fontSize: "0.75rem", wordBreak: "break-all" }}>
        {value}
      </code>
    </div>
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

const code: React.CSSProperties = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "0.75rem",
  color: "#c4b5fd",
  fontSize: "0.7rem",
  whiteSpace: "pre-wrap",
  overflow: "auto",
};
