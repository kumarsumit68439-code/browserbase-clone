import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

/**
 * Generic backend data API for external websites.
 * Stores JSON documents in bb_backend_docs (or falls back to user_metadata JSON on projects).
 * Body: { collection, action: "list"|"get"|"insert"|"update"|"delete", id?, data? }
 */
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

  const collection = String(body.collection || body.table || "default").slice(0, 64);
  const action = String(body.action || "list");
  const db = serviceDb();

  // Prefer dedicated table; if missing, use project user_metadata bag
  try {
    if (action === "list") {
      const { data, error } = await db
        .from("bb_backend_docs")
        .select("*")
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(body.limit) || 50, 100));
      if (error) throw error;
      return NextResponse.json({ collection, docs: data || [], backend: "supabase" }, { headers: cors });
    }

    if (action === "get") {
      const { data, error } = await db
        .from("bb_backend_docs")
        .select("*")
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .eq("id", body.id)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ doc: data }, { headers: cors });
    }

    if (action === "insert") {
      const id = body.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const row = {
        id,
        user_id: auth.userId,
        project_id: auth.projectId,
        collection,
        data: body.data || body.document || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await db.from("bb_backend_docs").insert(row).select().single();
      if (error) throw error;
      return NextResponse.json({ doc: data, backend: "supabase" }, { status: 201, headers: cors });
    }

    if (action === "update") {
      const { data, error } = await db
        .from("bb_backend_docs")
        .update({ data: body.data || body.document || {}, updated_at: new Date().toISOString() })
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ doc: data }, { headers: cors });
    }

    if (action === "delete") {
      const { error } = await db
        .from("bb_backend_docs")
        .delete()
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true }, { headers: cors });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400, headers: cors });
  } catch (e: any) {
    // Table may not exist — return clear setup SQL
    return NextResponse.json(
      {
        error: e?.message || "Database error",
        hint: "Create table bb_backend_docs in Supabase (SQL below)",
        sql: `create table if not exists bb_backend_docs (
  id text primary key,
  user_id uuid not null,
  project_id text,
  collection text not null,
  data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists bb_backend_docs_user_coll on bb_backend_docs(user_id, collection);`,
        firebase_note:
          "Optional: set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY for dual-write.",
      },
      { status: 500, headers: cors }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const collection = req.nextUrl.searchParams.get("collection") || "default";
  const db = serviceDb();
  try {
    const { data, error } = await db
      .from("bb_backend_docs")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("collection", collection)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ collection, docs: data || [] }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, docs: [] }, { status: 500, headers: cors });
  }
}
