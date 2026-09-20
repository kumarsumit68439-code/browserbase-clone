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

  const mode = body.mode || "run";

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
            content: `You are a Postgres SQL assistant for BrowserBase / Supabase.
Return ONLY one SQL statement (no markdown).
You may use SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE.
Prefer tables: bb_projects, bb_api_keys, bb_sessions, bb_backend_docs, bb_storage_objects.
User id for scoping: ${auth.userId}
For new tables use prefix bb_user_ when possible.`,
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

  const sql = String(body.sql || body.query || "").trim().replace(/;$/, "");
  if (!sql) {
    return NextResponse.json({ error: "sql required" }, { status: 400, headers: cors });
  }

  const db = serviceDb();
  const started = Date.now();

  try {
    const { data: rpcData, error: rpcError } = await db.rpc("exec_sql", {
      query_text: sql,
    });

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message, ms: Date.now() - started },
        { status: 400, headers: cors }
      );
    }

    const payload = rpcData as any;
    if (payload?.error) {
      return NextResponse.json(
        { error: payload.error, code: payload.code, ms: Date.now() - started },
        { status: 400, headers: cors }
      );
    }

    if (payload?.type === "select") {
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      return NextResponse.json(
        {
          rows,
          rowCount: rows.length,
          ms: Date.now() - started,
          via: "exec_sql",
          type: "select",
        },
        { headers: cors }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: payload?.message || "executed",
        type: payload?.type || "ddl",
        ms: Date.now() - started,
        via: "exec_sql",
        rows: [],
        rowCount: 0,
      },
      { headers: cors }
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
      engine: "Postgres via exec_sql",
      supports: ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP"],
      modes: ["run", "ai"],
    },
    { headers: cors }
  );
}
