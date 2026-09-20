import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";

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

export async function GET(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const db = serviceDb();
  const table = req.nextUrl.searchParams.get("table");

  if (table) {
    // columns + sample rows
    const { data: cols } = await db.rpc("exec_sql", {
      query_text: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table.replace(/'/g, "")}' ORDER BY ordinal_position`,
    });
    const { data: rowsPayload } = await db.rpc("exec_sql", {
      query_text: `SELECT * FROM ${table.replace(/[^a-zA-Z0-9_]/g, "")} LIMIT 50`,
    });
    const colRows = (cols as any)?.rows || [];
    const dataRows = (rowsPayload as any)?.rows || [];
    return NextResponse.json(
      { table, columns: colRows, rows: dataRows },
      { headers: cors }
    );
  }

  const { data, error } = await db.rpc("exec_sql", {
    query_text: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  const tables = ((data as any)?.rows || []).map((r: any) => r.table_name);
  return NextResponse.json({ tables }, { headers: cors });
}

export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }

  const action = body.action || "create";
  const db = serviceDb();

  if (action === "create") {
    let name = String(body.name || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400, headers: cors });
    if (!name.startsWith("bb_")) name = `bb_${name}`;

    const columns: { name: string; type: string }[] = body.columns || [
      { name: "id", type: "text" },
      { name: "user_id", type: "uuid" },
      { name: "data", type: "jsonb" },
      { name: "created_at", type: "timestamptz" },
    ];

    const colSql = columns
      .map((c) => {
        const n = c.name.replace(/[^a-zA-Z0-9_]/g, "");
        const t = (c.type || "text").replace(/[^a-zA-Z0-9_()\s]/g, "");
        if (n === "id") return "id text primary key";
        if (n === "created_at") return "created_at timestamptz default now()";
        return `${n} ${t}`;
      })
      .join(", ");

    const sql = `create table if not exists public.${name} (${colSql})`;
    const { data, error } = await db.rpc("exec_sql", { query_text: sql });
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
    if ((data as any)?.error) return NextResponse.json({ error: (data as any).error }, { status: 400, headers: cors });

    return NextResponse.json({ ok: true, table: name, sql }, { status: 201, headers: cors });
  }

  if (action === "drop") {
    let name = String(body.name || "").replace(/[^a-zA-Z0-9_]/g, "");
    if (!name.startsWith("bb_")) {
      return NextResponse.json({ error: "Can only drop bb_* tables" }, { status: 400, headers: cors });
    }
    const { data, error } = await db.rpc("exec_sql", {
      query_text: `drop table if exists public.${name}`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
    if ((data as any)?.error) return NextResponse.json({ error: (data as any).error }, { status: 400, headers: cors });
    return NextResponse.json({ ok: true }, { headers: cors });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400, headers: cors });
}
