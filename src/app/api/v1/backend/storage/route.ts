import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

  const bucket = req.nextUrl.searchParams.get("bucket") || "default";
  const db = serviceDb();
  const { data, error } = await db
    .from("bb_storage_objects")
    .select("*")
    .eq("user_id", auth.userId)
    .eq("bucket", bucket)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ bucket, objects: data || [] }, { headers: cors });
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

  const bucket = String(body.bucket || "default").slice(0, 64);
  const name = String(body.name || `file_${Date.now()}`).slice(0, 200);
  const path = String(body.path || `${bucket}/${name}`).slice(0, 400);
  const content = body.content ?? body.data ?? {};
  const id = body.id || `sto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const db = serviceDb();
  const row = {
    id,
    user_id: auth.userId,
    project_id: auth.projectId,
    bucket,
    path,
    name,
    content_type: body.content_type || "application/json",
    size_bytes: JSON.stringify(content).length,
    data: typeof content === "object" ? content : { value: content },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db.from("bb_storage_objects").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ object: data }, { status: 201, headers: cors });
}

export async function DELETE(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400, headers: cors });

  const db = serviceDb();
  const { error } = await db.from("bb_storage_objects").delete().eq("user_id", auth.userId).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ ok: true }, { headers: cors });
}
