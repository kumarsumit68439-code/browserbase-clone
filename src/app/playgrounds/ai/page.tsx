"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type Model = { id: string; label: string; provider: string };
type Msg = { role: "user" | "assistant"; content: string };

export default function AiPlaygroundPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keys, setKeys] = useState<{ full_key: string; name?: string }[]>([]);
  const [mode, setMode] = useState<"chat" | "agent">("chat");
  const [agentName, setAgentName] = useState("Support Agent");
  const [goal, setGoal] = useState("Answer product questions clearly.");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/ai/models")
      .then((r) => r.json())
      .then((d) => {
        setModels(d.models || []);
        setModel(d.default_model || d.models?.[0]?.id || "");
      })
      .catch(() => {});
    fetch("/api/v1/ai/keys")
      .then((r) => r.json())
      .then((d) => {
        const list = d.keys || [];
        setKeys(list);
        if (list[0]?.full_key) setApiKey(list[0].full_key);
      })
      .catch(() => {});
  }, []);

  const send = async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      setError("Select or paste an AI API key (generate at /ai-keys)");
      return;
    }
    setError("");
    setLoading(true);
    const userText = input.trim();
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: userText }]);

    try {
      const url = mode === "agent" ? "/api/v1/ai/agent" : "/api/v1/ai/chat";
      const body =
        mode === "agent"
          ? { message: userText, model, agent_name: agentName, goal }
          : { message: userText, model };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "x-bb-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.hint || "Request failed");

      const reply =
        mode === "agent"
          ? data.reply
          : data.choices?.[0]?.message?.content || JSON.stringify(data);
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setError(e.message);
      setMsgs((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <AppShell active="/playgrounds/ai">
      <h1 className="page-title">AI Response Playground</h1>
      <p className="page-sub">Select model · test chat or agent · same API any website can call</p>

      {error && (
        <div className="card" style={{ marginBottom: 12, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <label className="muted" style={{ fontSize: "0.8rem" }}>Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} style={field}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.provider})
              </option>
            ))}
          </select>

          <label className="muted" style={{ fontSize: "0.8rem" }}>AI API Key</label>
          <select
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={field}
          >
            <option value="">— select fetched key —</option>
            {keys.map((k) => (
              <option key={k.full_key} value={k.full_key}>
                {(k.name || "Key") + " · " + k.full_key.slice(0, 18)}…
              </option>
            ))}
          </select>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="or paste bb_ai_..."
            style={field}
          />

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              className={mode === "chat" ? "btn btn-primary" : "btn btn-white"}
              onClick={() => setMode("chat")}
              style={{ flex: 1 }}
            >
              Chat
            </button>
            <button
              type="button"
              className={mode === "agent" ? "btn btn-primary" : "btn btn-white"}
              onClick={() => setMode("agent")}
              style={{ flex: 1 }}
            >
              AI Agent
            </button>
          </div>

          {mode === "agent" && (
            <>
              <label className="muted" style={{ fontSize: "0.8rem" }}>Agent name</label>
              <input value={agentName} onChange={(e) => setAgentName(e.target.value)} style={field} />
              <label className="muted" style={{ fontSize: "0.8rem" }}>Goal / instructions</label>
              <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} style={field} />
            </>
          )}
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 320 }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            {!msgs.length && (
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                Chat only test — messages go to your backend → open-source model → real reply.
              </p>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  padding: "0.6rem 0.75rem",
                  borderRadius: 10,
                  background: m.role === "user" ? "#27272a" : "#09090b",
                  border: "1px solid #27272a",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                <span className="muted" style={{ fontSize: "0.7rem" }}>
                  {m.role}
                </span>
                <div>{m.content}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message…"
              style={{ ...field, flex: "1 1 160px", marginBottom: 0 }}
            />
            <button className="btn btn-primary" onClick={send} disabled={loading}>
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>
          Use on any website / localhost
        </h2>
        <pre className="mono code-block" style={codeBox}>{`// Browser or Node — CORS enabled (*)
const res = await fetch("${base}/api/v1/ai/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey || "bb_ai_YOUR_KEY"}",
  },
  body: JSON.stringify({
    model: "${model || "llama-3.3-70b-versatile"}",
    message: "Hello from my website",
  }),
});
const data = await res.json();
console.log(data.choices[0].message.content);

// AI Agent
fetch("${base}/api/v1/ai/agent", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey || "bb_ai_YOUR_KEY"}",
  },
  body: JSON.stringify({
    agent_name: "Sales Bot",
    goal: "Qualify leads politely",
    message: "I need pricing",
    model: "${model || "llama-3.3-70b-versatile"}",
  }),
});

# curl
curl -X POST ${base}/api/v1/ai/chat \\
  -H "Authorization: Bearer ${apiKey || "bb_ai_YOUR_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${model || "llama-3.3-70b-versatile"}","message":"Hi"}'`}</pre>
      </div>
    </AppShell>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  marginBottom: 10,
  padding: "0.6rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
  fontSize: "0.875rem",
};

const codeBox: React.CSSProperties = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "0.75rem",
  color: "#c4b5fd",
  whiteSpace: "pre-wrap",
  fontSize: "0.75rem",
  overflow: "auto",
};
