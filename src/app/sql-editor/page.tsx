"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";

type TermLine = { type: "in" | "out" | "err" | "sys"; text: string };

export default function SqlEditorPage() {
  const [sql, setSql] = useState("SELECT * FROM bb_api_keys LIMIT 10");
  const [aiPrompt, setAiPrompt] = useState("Show my backend documents");
  const [rows, setRows] = useState<any[] | null>(null);
  const [meta, setMeta] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keys, setKeys] = useState<{ full_key: string; name?: string }[]>([]);
  const [term, setTerm] = useState<TermLine[]>([
    { type: "sys", text: "BrowserBase SQL CLI — type help, tables, or a SELECT query" },
  ]);
  const [cli, setCli] = useState("");
  const termEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/backend/keys")
      .then((r) => r.json())
      .then((d) => {
        const list = d.keys || [];
        setKeys(list);
        if (list[0]?.full_key) setApiKey(list[0].full_key);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    termEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [term]);

  const headers = (): HeadersInit => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (apiKey) {
      h["Authorization"] = `Bearer ${apiKey}`;
      h["x-bb-api-key"] = apiKey;
    }
    return h;
  };

  const runSql = async (query?: string) => {
    const q = (query ?? sql).trim();
    if (!q) return;
    setLoading(true);
    setMeta("");
    try {
      const res = await fetch("/api/v1/backend/sql", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ mode: "run", sql: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.hint || "Query failed");
      setRows(Array.isArray(data.rows) ? data.rows : [data.rows]);
      setMeta(`${data.rowCount ?? 0} rows · ${data.ms ?? "?"}ms · via ${data.via || "sql"}`);
      setTerm((t) => [
        ...t,
        { type: "in", text: q },
        {
          type: "out",
          text: data.note
            ? `${data.rowCount} rows (${data.ms}ms) — ${data.note}`
            : `OK ${data.rowCount} rows (${data.ms}ms)`,
        },
      ]);
    } catch (e: any) {
      setRows(null);
      setMeta(e.message);
      setTerm((t) => [...t, { type: "in", text: q }, { type: "err", text: e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const aiSql = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backend/sql", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ mode: "ai", ai_prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed");
      setSql(data.sql || "");
      setTerm((t) => [
        ...t,
        { type: "sys", text: `AI (${data.provider}/${data.model}): generated SQL` },
        { type: "out", text: data.sql },
      ]);
    } catch (e: any) {
      setTerm((t) => [...t, { type: "err", text: e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const onCli = async () => {
    const cmd = cli.trim();
    if (!cmd) return;
    setCli("");
    if (cmd === "help") {
      setTerm((t) => [
        ...t,
        { type: "in", text: cmd },
        {
          type: "out",
          text: "commands: help | tables | clear | ai <prompt> | SELECT ...",
        },
      ]);
      return;
    }
    if (cmd === "clear") {
      setTerm([{ type: "sys", text: "cleared" }]);
      return;
    }
    if (cmd === "tables") {
      setTerm((t) => [
        ...t,
        { type: "in", text: cmd },
        {
          type: "out",
          text: "bb_projects, bb_api_keys, bb_sessions, bb_backend_docs",
        },
      ]);
      return;
    }
    if (cmd.startsWith("ai ")) {
      setAiPrompt(cmd.slice(3));
      setTerm((t) => [...t, { type: "in", text: cmd }]);
      const res = await fetch("/api/v1/backend/sql", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ mode: "ai", ai_prompt: cmd.slice(3) }),
      });
      const data = await res.json();
      if (data.sql) {
        setSql(data.sql);
        setTerm((t) => [...t, { type: "out", text: data.sql }]);
      } else {
        setTerm((t) => [...t, { type: "err", text: data.error || "AI failed" }]);
      }
      return;
    }
    setSql(cmd);
    await runSql(cmd);
  };

  const cols = rows && rows[0] ? Object.keys(rows[0]) : [];

  return (
    <AppShell active="/sql-editor">
      <h1 className="page-title">SQL Editor</h1>
      <p className="page-sub">CLI terminal · AI SQL · connected to backend API + database</p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <label className="muted" style={{ fontSize: "0.8rem" }}>Backend / API key</label>
        <select value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={field}>
          <option value="">Session cookie auth</option>
          {keys.map((k) => (
            <option key={k.full_key} value={k.full_key}>
              {(k.name || "key") + " · " + k.full_key.slice(0, 20)}…
            </option>
          ))}
        </select>
      </div>

      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Editor</h2>
          <textarea value={sql} onChange={(e) => setSql(e.target.value)} rows={8} style={{ ...field, fontFamily: "ui-monospace, monospace" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => runSql()} disabled={loading}>
              {loading ? "Running…" : "Run SQL"}
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="muted" style={{ fontSize: "0.8rem" }}>AI → SQL (site AI API)</label>
            <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} style={field} />
            <button className="btn btn-white" onClick={aiSql} disabled={loading}>
              Generate with AI
            </button>
          </div>
          {meta && <p className="muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>{meta}</p>}
        </div>

        <div className="card" style={{ background: "#050505", minHeight: 320 }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8, color: "#86efac" }}>
            CLI emulator
          </h2>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.78rem",
              maxHeight: 260,
              overflowY: "auto",
              marginBottom: 8,
            }}
          >
            {term.map((l, i) => (
              <div
                key={i}
                style={{
                  color:
                    l.type === "err"
                      ? "#f87171"
                      : l.type === "in"
                        ? "#c4b5fd"
                        : l.type === "sys"
                          ? "#64748b"
                          : "#86efac",
                  marginBottom: 4,
                  whiteSpace: "pre-wrap",
                }}
              >
                {l.type === "in" ? `$ ${l.text}` : l.text}
              </div>
            ))}
            <div ref={termEnd} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#86efac", fontFamily: "monospace" }}>$</span>
            <input
              value={cli}
              onChange={(e) => setCli(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onCli()}
              placeholder="SELECT … | help | tables | ai list keys"
              style={{ ...field, marginBottom: 0, flex: 1 }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>Results</h2>
        {!rows?.length ? (
          <p className="muted">No rows</p>
        ) : (
          <div className="table-wrap" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #27272a", textAlign: "left" }}>
                  {cols.map((c) => (
                    <th key={c} style={{ padding: "6px 8px", color: "#a1a1aa" }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #27272a" }}>
                    {cols.map((c) => (
                      <td key={c} style={{ padding: "6px 8px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
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
    </AppShell>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  marginBottom: 10,
  padding: "0.55rem 0.7rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
  fontSize: "0.85rem",
};
