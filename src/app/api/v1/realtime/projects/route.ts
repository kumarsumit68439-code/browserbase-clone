import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";
import { randomBytes } from "crypto";

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

function genId(prefix: string, bytes = 8) {
  return `${prefix}_${randomBytes(bytes).toString("hex")}`;
}

export async function GET(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const db = serviceDb();
  const { data, error } = await db
    .from("bb_rt_projects")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ projects: data || [] }, { headers: cors });
}

export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const name = String(body.name || "My Realtime Project").slice(0, 80);
  const origin =
    req.headers.get("x-forwarded-host")
      ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
      : req.nextUrl.origin;

  const projectId = genId("rtproj", 6);
  const apiKey = `rt_key_${randomBytes(16).toString("hex")}`;
  const clientId = `rt_client_${randomBytes(8).toString("hex")}`;
  const clientSecret = `rt_secret_${randomBytes(16).toString("hex")}`;
  const messagingSenderId = String(Math.floor(1000000000 + Math.random() * 9000000000));
  const appId = `1:${messagingSenderId}:web:${randomBytes(8).toString("hex")}`;
  const measurementId = `G-${randomBytes(5).toString("hex").toUpperCase()}`;
  const databaseUrl = `${origin}/api/v1/realtime/data?project=${projectId}`;

  const row = {
    id: genId("rtp"),
    user_id: auth.userId,
    name,
    project_id: projectId,
    api_key: apiKey,
    database_url: databaseUrl,
    messaging_sender_id: messagingSenderId,
    app_id: appId,
    client_id: clientId,
    client_secret: clientSecret,
    measurement_id: measurementId,
    created_at: new Date().toISOString(),
  };

  const db = serviceDb();
  const { data, error } = await db.from("bb_rt_projects").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });

  // default rules
  await db.from("bb_rt_rules").insert({
    id: genId("rules"),
    project_id: projectId,
    user_id: auth.userId,
    rules_json: {
      rules: {
        ".read": true,
        ".write": true,
        users: { "$uid": { ".read": "auth != null", ".write": "auth != null && auth.uid == $uid" } },
      },
    },
    updated_at: new Date().toISOString(),
  });

  // seed root data
  await db.from("bb_rt_data").insert({
    id: genId("rtd"),
    project_id: projectId,
    user_id: auth.userId,
    path: "/",
    value: { welcome: true, created: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      project: data,
      config: {
        apiKey,
        authDomain: `${projectId}.browserbase.app`,
        databaseURL: databaseUrl,
        projectId,
        storageBucket: `${projectId}.storage.app`,
        messagingSenderId,
        appId,
        measurementId,
        clientId,
        clientSecret,
      },
    },
    { status: 201, headers: cors }
  );
}
