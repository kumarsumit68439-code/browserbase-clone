import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

async function resolveProject(req: NextRequest, projectId: string) {
  const db = serviceDb();
  const apiKey =
    req.headers.get("x-rt-api-key") ||
    req.headers.get("x-api-key") ||
    req.nextUrl.searchParams.get("apiKey");

  let q = db.from("bb_rt_projects").select("*").eq("project_id", projectId);
  const { data: byId } = await q.maybeSingle();
  if (!byId) return null;

  // Allow owner session OR matching api key
  const auth = await authRequest(req);
  if (auth && byId.user_id === auth.userId) return byId;
  if (apiKey && apiKey === byId.api_key) return byId;
  if (auth) return null; // logged in but not owner
  if (apiKey) return null;
  // public read if rules allow — still require auth or key for write; GET may use key
  return null;
}

function normalizePath(p: string) {
  let path = (p || "/").trim();
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project") || "";
  const path = normalizePath(req.nextUrl.searchParams.get("path") || "/");
  if (!projectId) return NextResponse.json({ error: "project required" }, { status: 400, headers: cors });

  const db = serviceDb();
  const auth = await authRequest(req);
  const apiKey = req.headers.get("x-rt-api-key") || req.nextUrl.searchParams.get("apiKey");

  const { data: proj } = await db.from("bb_rt_projects").select("*").eq("project_id", projectId).maybeSingle();
  if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404, headers: cors });

  const allowed =
    (auth && proj.user_id === auth.userId) || (apiKey && apiKey === proj.api_key);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  // exact path or children under path
  const { data: nodes } = await db
    .from("bb_rt_data")
    .select("*")
    .eq("project_id", projectId)
    .or(`path.eq.${path},path.like.${path === "/" ? "/%" : path + "/%"}`)
    .order("path");

  // build tree-ish object
  const tree: Record<string, any> = {};
  for (const n of nodes || []) {
    tree[n.path] = n.value;
  }

  const exact = (nodes || []).find((n) => n.path === path);

  return NextResponse.json(
    {
      project: projectId,
      path,
      value: exact?.value ?? null,
      children: tree,
      nodes: nodes || [],
    },
    { headers: cors }
  );
}

export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }

  const projectId = String(body.project || body.project_id || req.nextUrl.searchParams.get("project") || "");
  const path = normalizePath(body.path || "/");
  const value = body.value ?? body.data ?? {};

  if (!projectId) return NextResponse.json({ error: "project required" }, { status: 400, headers: cors });

  const db = serviceDb();
  const apiKey = req.headers.get("x-rt-api-key") || body.apiKey;
  const { data: proj } = await db.from("bb_rt_projects").select("*").eq("project_id", projectId).maybeSingle();
  if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404, headers: cors });

  const allowed =
    (auth && proj.user_id === auth.userId) || (apiKey && apiKey === proj.api_key);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const id = `rtd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const { data: existing } = await db
    .from("bb_rt_data")
    .select("id")
    .eq("project_id", projectId)
    .eq("path", path)
    .maybeSingle();

  if (existing) {
    const { data, error } = await db
      .from("bb_rt_data")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
    return NextResponse.json({ ok: true, node: data }, { headers: cors });
  }

  const { data, error } = await db
    .from("bb_rt_data")
    .insert({
      id,
      project_id: projectId,
      user_id: proj.user_id,
      path,
      value,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ ok: true, node: data }, { status: 201, headers: cors });
}

export async function DELETE(req: NextRequest) {
  const auth = await authRequest(req);
  const projectId = req.nextUrl.searchParams.get("project") || "";
  const path = normalizePath(req.nextUrl.searchParams.get("path") || "");
  if (!projectId || !path) {
    return NextResponse.json({ error: "project and path required" }, { status: 400, headers: cors });
  }

  const db = serviceDb();
  const { data: proj } = await db.from("bb_rt_projects").select("*").eq("project_id", projectId).maybeSingle();
  if (!proj) return NextResponse.json({ error: "not found" }, { status: 404, headers: cors });
  if (!auth || proj.user_id !== auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  await db.from("bb_rt_data").delete().eq("project_id", projectId).eq("path", path);
  return NextResponse.json({ ok: true }, { headers: cors });
}
