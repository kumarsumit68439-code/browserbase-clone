import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
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

/** PATCH — revoke (active=false) or reactivate */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const { id } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const active = body.active === true;
  const action = body.action; // "revoke" | "activate"

  const db = serviceDb();
  const { data: existing } = await db
    .from("bb_api_keys")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.user_id !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: cors });
  }

  const nextActive = action === "revoke" ? false : action === "activate" ? true : active;

  const { data, error } = await db
    .from("bb_api_keys")
    .update({ active: nextActive })
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select("id, full_key, key_prefix, name, active, created_at, project_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ key: data, message: nextActive ? "Key activated" : "Key revoked" }, { headers: cors });
}

/** DELETE — permanently remove key (owner only) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const { id } = await params;
  const db = serviceDb();

  const { data: existing } = await db
    .from("bb_api_keys")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.user_id !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: cors });
  }

  const { error } = await db.from("bb_api_keys").delete().eq("id", id).eq("user_id", auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });

  return NextResponse.json({ ok: true, message: "Key deleted" }, { headers: cors });
}
