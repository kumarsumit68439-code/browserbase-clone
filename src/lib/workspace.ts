import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { generateApiKey, generateProjectId } from "@/lib/keys";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

/** Create Default project + API key if missing (email / phone / Google all paths) */
export async function ensureWorkspace(userId: string) {
  const db = serviceDb();

  const { data: existing } = await db
    .from("bb_projects")
    .select("id, name, created_at")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: keys } = await db
      .from("bb_api_keys")
      .select("id, full_key, key_prefix, active, created_at, project_id, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Project exists but no key — create one
    if (!keys?.length) {
      const { fullKey, prefix, hash } = generateApiKey();
      await db.from("bb_api_keys").insert({
        id: `key_${Date.now()}`,
        project_id: existing.id,
        user_id: userId,
        key_prefix: prefix,
        key_hash: hash,
        full_key: fullKey,
        name: "Default",
        active: true,
      });
      const { data: keys2 } = await db
        .from("bb_api_keys")
        .select("id, full_key, key_prefix, active, created_at, project_id, name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return { project: existing, apiKeys: keys2 || [] };
    }

    return { project: existing, apiKeys: keys || [] };
  }

  const projectId = generateProjectId();
  const { fullKey, prefix, hash } = generateApiKey();

  const { data: project, error: pErr } = await db
    .from("bb_projects")
    .insert({
      id: projectId,
      user_id: userId,
      name: "Default Project",
    })
    .select("id, name, created_at")
    .single();

  if (pErr) {
    console.error("ensureWorkspace project", pErr.message);
    return { project: null, apiKeys: [] as any[] };
  }

  await db.from("bb_api_keys").insert({
    id: `key_${Date.now()}`,
    project_id: projectId,
    user_id: userId,
    key_prefix: prefix,
    key_hash: hash,
    full_key: fullKey,
    name: "Default",
    active: true,
  });

  const { data: apiKeys } = await db
    .from("bb_api_keys")
    .select("id, full_key, key_prefix, active, created_at, project_id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { project, apiKeys: apiKeys || [] };
}

export async function getWorkspace() {
  const { supabase, user } = await requireUser();

  // Always provision for any auth method (email / phone / Google)
  const ensured = await ensureWorkspace(user.id);

  const { data: sessions } = await supabase
    .from("bb_sessions")
    .select("id, status, region, created_at, connect_url, started_at, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const project = ensured.project;
  const apiKeys = ensured.apiKeys;

  return {
    supabase,
    user,
    project,
    apiKeys,
    sessions: sessions || [],
    primaryKey: apiKeys?.find((k: any) => k.active)?.full_key || apiKeys?.[0]?.full_key || null,
    projectId: project?.id || null,
  };
}
