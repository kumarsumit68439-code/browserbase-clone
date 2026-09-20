import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";
import { generateApiKey } from "@/lib/keys";
import { ensureWorkspace } from "@/lib/workspace";

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

  await ensureWorkspace(auth.userId);
  const db = serviceDb();
  const { data, error } = await db
    .from("bb_api_keys")
    .select("id, full_key, key_prefix, name, active, created_at, project_id")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });

  return NextResponse.json(
    { keys: data || [], projectId: auth.projectId || data?.[0]?.project_id || null },
    { headers: cors }
  );
}

export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const ensured = await ensureWorkspace(auth.userId);
  const projectId = ensured.project?.id || auth.projectId;
  if (!projectId) return NextResponse.json({ error: "No project" }, { status: 400, headers: cors });

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const { fullKey, prefix, hash } = generateApiKey();
  const db = serviceDb();
  const { data, error } = await db
    .from("bb_api_keys")
    .insert({
      id: `key_${Date.now()}`,
      project_id: projectId,
      user_id: auth.userId,
      key_prefix: prefix,
      key_hash: hash,
      full_key: fullKey,
      name: body.name || "API Key",
      active: true,
    })
    .select("id, full_key, key_prefix, name, active, created_at, project_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ key: data }, { status: 201, headers: cors });
}
