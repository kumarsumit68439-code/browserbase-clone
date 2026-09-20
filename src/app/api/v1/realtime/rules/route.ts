import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-bb-api-key, x-api-key, x-rt-api-key",
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

  const projectId = req.nextUrl.searchParams.get("project");
  if (!projectId) return NextResponse.json({ error: "project required" }, { status: 400, headers: cors });

  const db = serviceDb();
  const { data, error } = await db
    .from("bb_rt_rules")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json(
    {
      rules: data?.rules_json || { rules: { ".read": true, ".write": true } },
      updated_at: data?.updated_at,
    },
    { headers: cors }
  );
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

  const projectId = String(body.project || body.project_id || "");
  if (!projectId) return NextResponse.json({ error: "project required" }, { status: 400, headers: cors });

  let rulesJson = body.rules;
  if (typeof body.rules_text === "string") {
    try {
      rulesJson = JSON.parse(body.rules_text);
    } catch {
      return NextResponse.json({ error: "Invalid rules JSON — Expected valid JSON" }, { status: 400, headers: cors });
    }
  }
  if (!rulesJson || typeof rulesJson !== "object") {
    return NextResponse.json({ error: "rules object required" }, { status: 400, headers: cors });
  }

  const db = serviceDb();
  const { data: proj } = await db
    .from("bb_rt_projects")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404, headers: cors });

  const { data: existing } = await db
    .from("bb_rt_rules")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await db
      .from("bb_rt_rules")
      .update({ rules_json: rulesJson, updated_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
    return NextResponse.json({ ok: true, rules: data.rules_json, published: true }, { headers: cors });
  }

  const { data, error } = await db
    .from("bb_rt_rules")
    .insert({
      id: `rules_${Date.now()}`,
      project_id: projectId,
      user_id: auth.userId,
      rules_json: rulesJson,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ ok: true, rules: data.rules_json, published: true }, { headers: cors });
}
