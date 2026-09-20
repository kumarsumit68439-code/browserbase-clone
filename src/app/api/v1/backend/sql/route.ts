import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";
import { callOpenSourceChat } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-bb-api-key, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

/** Allow only safe read-focused SQL patterns for the SQL editor */
function isSafeSelect(sql: string): boolean {
  const s = sql.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s.startsWith("select") && !s.startsWith("with")) return false;
  const banned = [
    "insert ",
    "update ",
    "delete ",
    "drop ",
    "alter ",
    "create ",
    "truncate ",
    "grant ",
    "revoke ",
    "copy ",
    "execute ",
    "pg_",
    "information_schema",
    ";--",
  ];
  // multi-statement
  if ((s.match(/;/g) || []).length > 1) return false;
  if (s.includes(";") && !s.trim().endsWith(";")) return false;
  for (const b of banned) {
    if (s.includes(b) && !s.startsWith("select") && b !== "information_schema") {
      // allow select from information_schema tables listing only via whitelist below
    }
    if (["insert ", "update ", "delete ", "drop ", "alter ", "create ", "truncate ", "grant ", "revoke ", "copy ", "execute "].includes(b) && s.includes(b)) {
      return false;
    }
  }
  return true;
}

const ALLOWED_TABLES = [
  "bb_projects",
  "bb_api_keys",
  "bb_sessions",
  "bb_backend_docs",
];

export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }

  const mode = body.mode || "run"; // run | ai

  // AI: generate SQL from natural language using site AI
  if (mode === "ai" || body.ai_prompt) {
    const prompt = String(body.ai_prompt || body.prompt || body.message || "");
    if (!prompt) {
      return NextResponse.json({ error: "ai_prompt required" }, { status: 400, headers: cors });
    }
    try {
      const result = await callOpenSourceChat(
        [
          {
            role: "system",
            content: `You are a SQL assistant for BrowserBase Postgres (Supabase).
Allowed tables only: ${ALLOWED_TABLES.join(", ")}.
User is scoped by user_id = '${auth.userId}'.
Return ONLY a single SELECT query, no markdown, no explanation.
Prefer filtering by user_id when the table has that column.
bb_api_keys has: id, full_key, name, active, user_id, project_id, created_at
bb_sessions has: id, status, region, user_id, project_id, connect_url, created_at
bb_backend_docs has: id, user_id, project_id, collection, data, created_at
bb_projects has: id, user_id, name`,
          },
          { role: "user", content: prompt },
        ],
        { model: body.model }
      );
      let sql = result.content.trim();
      sql = sql.replace(/^```sql\n?/i, "").replace(/```$/i, "").trim();
      return NextResponse.json(
        { sql, model: result.model, provider: result.provider },
        { headers: cors }
      );
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "AI failed" }, { status: 503, headers: cors });
    }
  }

  const sql = String(body.sql || body.query || "").trim();
  if (!sql) {
    return NextResponse.json({ error: "sql required" }, { status: 400, headers: cors });
  }

  if (!isSafeSelect(sql)) {
    return NextResponse.json(
      {
        error: "Only single SELECT queries allowed in SQL editor",
        hint: "Use /api/v1/backend/data for insert/update/delete",
      },
      { status: 400, headers: cors }
    );
  }

  // Run via RPC if available, else table helpers for common patterns
  const db = serviceDb();
  const started = Date.now();

  try {
    // Prefer exec_sql function if user created it; fallback to limited table reads
    const { data: rpcData, error: rpcError } = await db.rpc("exec_readonly_sql", {
      query_text: sql,
    });

    if (!rpcError && rpcData !== undefined) {
      return NextResponse.json(
        {
          rows: Array.isArray(rpcData) ? rpcData : rpcData,
          rowCount: Array.isArray(rpcData) ? rpcData.length : 1,
          ms: Date.now() - started,
          via: "rpc",
        },
        { headers: cors }
      );
    }

    // Fallback: parse simple SELECT * FROM table WHERE user_id patterns
    const m = sql.match(/from\s+([a-z0-9_]+)/i);
    const table = m?.[1]?.toLowerCase();
    if (table && ALLOWED_TABLES.includes(table)) {
      let q = db.from(table).select("*").limit(100);
      // Scope by user when column exists
      if (["bb_api_keys", "bb_sessions", "bb_backend_docs", "bb_projects"].includes(table)) {
        q = q.eq("user_id", auth.userId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return NextResponse.json(
        {
          rows: data || [],
          rowCount: (data || []).length,
          ms: Date.now() - started,
          via: "table_fallback",
          note: rpcError
            ? `RPC unavailable (${rpcError.message}). Ran scoped table read for ${table}. Create exec_readonly_sql for full SQL.`
            : undefined,
          sql_requested: sql,
        },
        { headers: cors }
      );
    }

    return NextResponse.json(
      {
        error: "Could not execute SQL",
        detail: rpcError?.message,
        hint: `Create function exec_readonly_sql or query allowed tables: ${ALLOWED_TABLES.join(", ")}`,
      },
      { status: 400, headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "SQL failed", ms: Date.now() - started },
      { status: 500, headers: cors }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "POST /api/v1/backend/sql",
      modes: ["run", "ai"],
      body_run: { sql: "SELECT ...", mode: "run" },
      body_ai: { mode: "ai", ai_prompt: "list my api keys" },
      allowed_tables: ALLOWED_TABLES,
    },
    { headers: cors }
  );
}
