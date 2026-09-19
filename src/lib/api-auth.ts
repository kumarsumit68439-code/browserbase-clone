import { NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

export function extractApiKey(req: NextRequest): string | null {
  const headerKey = req.headers.get("x-bb-api-key") || req.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function authRequest(req: NextRequest): Promise<{
  userId: string;
  projectId: string | null;
  via: "session" | "api_key";
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: project } = await supabase
      .from("bb_projects")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    return { userId: user.id, projectId: project?.id || null, via: "session" };
  }

  const apiKey = extractApiKey(req);
  if (!apiKey) return null;

  const hash = createHash("sha256").update(apiKey).digest("hex");
  const db = serviceDb();
  const { data } = await db
    .from("bb_api_keys")
    .select("user_id, project_id, active")
    .eq("key_hash", hash)
    .eq("active", true)
    .maybeSingle();

  if (!data) return null;
  return { userId: data.user_id, projectId: data.project_id, via: "api_key" };
}
