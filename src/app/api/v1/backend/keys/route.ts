import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";
import { generateBackendApiKey } from "@/lib/keys";

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
  const { data, error } = await db
    .from("bb_api_keys")
    .select("id, full_key, key_prefix, name, active, created_at, project_id")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });

  const all = data || [];
  const backendKeys = all.filter(
    (k) => k.full_key?.startsWith("bb_backend_") || k.name?.toLowerCase().includes("backend")
  );

  return NextResponse.json(
    {
      keys: backendKeys.length ? backendKeys : all,
      databases: {
        primary: "supabase",
        firebase_configured: Boolean(process.env.FIREBASE_PROJECT_ID),
      },
      endpoints: {
        data: "POST /api/v1/backend/data",
        query: "GET /api/v1/backend/data?collection=...",
        langgraph: "POST /api/v1/langgraph/run",
      },
    },
    { headers: cors }
  );
}

export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const db = serviceDb();
  let projectId = auth.projectId;
  if (!projectId) {
    const { data: project } = await db
      .from("bb_projects")
      .select("id")
      .eq("user_id", auth.userId)
      .limit(1)
      .maybeSingle();
    projectId = project?.id || null;
  }
  if (!projectId) {
    return NextResponse.json({ error: "No project" }, { status: 400, headers: cors });
  }

  const { fullKey, prefix, hash } = generateBackendApiKey();
  const name = body.name || "Backend API Key";
  const id = `key_be_${Date.now()}`;

  const { data, error } = await db
    .from("bb_api_keys")
    .insert({
      id,
      project_id: projectId,
      user_id: auth.userId,
      key_prefix: prefix,
      key_hash: hash,
      full_key: fullKey,
      name,
      active: true,
    })
    .select("id, full_key, key_prefix, name, active, created_at, project_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });

  return NextResponse.json(
    {
      key: data,
      message: "Backend API key created. Use from any website to access your backend + database.",
      usage: {
        header: `Authorization: Bearer ${fullKey}`,
        data: "POST /api/v1/backend/data",
        langgraph: "POST /api/v1/langgraph/run",
      },
    },
    { status: 201, headers: cors }
  );
}
