"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default function TableEditorPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [newName, setNewName] = useState("users_data");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTables = async () => {
    const res = await fetch("/api/v1/backend/tables");
    const data = await res.json();
    if (res.ok) setTables(data.tables || []);
    else setMsg(data.error || "Failed");
  };

  const openTable = async (t: string) => {
    setSelected(t);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/backend/tables?table=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setColumns(data.columns || []);
      setRows(data.rows || []);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const createTable = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/v1/backend/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newName,
          columns: [
            { name: "id", type: "text" },
            { name: "user_id", type: "uuid" },
            { name: "name", type: "text" },
            { name: "data", type: "jsonb" },
            { name: "created_at", type: "timestamptz" },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Created ${data.table}`);
      await loadTables();
      if (data.table) openTable(data.table);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const colNames = rows[0] ? Object.keys(rows[0]) : columns.map((c) => c.column_name);

  return (
    <AppShell active="/database/tables">
      <h1 className="page-title">Table Editor</h1>
      <p className="page-sub">Create tables · browse rows · real Postgres</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/sql-editor" className="btn btn-primary">
          SQL Editor
        </Link>
        <Link href="/database" className="btn btn-white">
          Realtime DB
        </Link>
        <Link href="/storage" className="btn btn-white">
          Storage
        </Link>
      </div>

      {msg && (
        <div className="card" style={{ marginBottom: 12, color: msg.startsWith("Created") ? "#86efac" : "#fca5a5" }}>
          {msg}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Tables</h2>
          <ul style={{ fontSize: "0.85rem", maxHeight: 280, overflowY: "auto" }}>
            {tables.map((t) => (
              <li key={t} style={{ marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => openTable(t)}
                  style={{
                    background: selected === t ? "#27272a" : "transparent",
                    border: "none",
                    color: selected === t ? "#fff" : "#a1a1aa",
                    cursor: "pointer",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "0.8rem",
                    padding: "4px 8px",
                    borderRadius: 6,
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <label className="muted" style={{ fontSize: "0.75rem" }}>New table name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} style={field} />
            <button className="btn btn-primary" onClick={createTable} disabled={loading}>
              Create table
            </button>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>
            {selected || "Select a table"}
          </h2>
          {loading && <p className="muted">Loading…</p>}
          {!!columns.length && (
            <p className="muted" style={{ fontSize: "0.75rem", marginBottom: 8 }}>
              Columns:{" "}
              {columns.map((c) => `${c.column_name}:${c.data_type}`).join(" · ")}
            </p>
          )}
          {!rows.length && selected && !loading && <p className="muted">No rows</p>}
          {!!rows.length && (
            <div style={{ overflowX: "auto", maxHeight: 360 }}>
              <table style={{ width: "100%", fontSize: "0.72rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #27272a" }}>
                    {colNames.map((c) => (
                      <th key={c} style={{ padding: 6, textAlign: "left", color: "#a1a1aa" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #27272a" }}>
                      {colNames.map((c) => (
                        <td key={c} style={{ padding: 6, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
