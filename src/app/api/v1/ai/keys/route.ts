import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";
import { generateAiApiKey } from "@/lib/keys";

export const dynamic = "force-dynamic";

function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

/** List AI API keys for the authenticated user */
export async function GET(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = serviceDb();
  const { data, error } = await db
    .from("bb_api_keys")
    .select("id, full_key, key_prefix, name, active, created_at, project_id")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const aiKeys = (data || []).filter(
    (k) => k.name?.toLowerCase().includes("ai") || k.full_key?.startsWith("bb_ai_")
  );

  return NextResponse.json({
    keys: aiKeys.length ? aiKeys : data || [],
    endpoints: {
      chat: "/api/v1/ai/chat",
      createKey: "POST /api/v1/ai/keys",
    },
  });
}

/** Generate a new real AI response API key (stored in Supabase) */
export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized. Login or pass Bearer / x-bb-api-key." },
      { status: 401 }
    );
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
    return NextResponse.json({ error: "No project. Login once to create workspace." }, { status: 400 });
  }

  const { fullKey, prefix, hash } = generateAiApiKey();
  const name = body.name || "AI Response Key";
  const id = `key_ai_${Date.now()}`;

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      key: data,
      message: "AI API key created. Use as Bearer token on /api/v1/ai/chat",
      usage: {
        header: `Authorization: Bearer ${fullKey}`,
        alt: `x-bb-api-key: ${fullKey}`,
        chat: "POST /api/v1/ai/chat",
      },
    },
    { status: 201 }
  );
}
