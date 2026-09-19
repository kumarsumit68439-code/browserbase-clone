import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getWorkspace() {
  const { supabase, user } = await requireUser();

  const { data: project } = await supabase
    .from("bb_projects")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const { data: apiKeys } = await supabase
    .from("bb_api_keys")
    .select("id, full_key, key_prefix, active, created_at, project_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: sessions } = await supabase
    .from("bb_sessions")
    .select("id, status, region, created_at, connect_url, started_at, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    supabase,
    user,
    project,
    apiKeys: apiKeys || [],
    sessions: sessions || [],
    primaryKey: apiKeys?.find((k) => k.active)?.full_key || null,
    projectId: project?.id || null,
  };
}
