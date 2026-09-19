import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function secret() {
  return process.env.MCP_OAUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-mcp-secret-change-me";
}

export function signPayload(payload: Record<string, unknown>, ttlSec = 3600): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyPayload<T extends Record<string, unknown>>(token: string): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp?: number };
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function randomCode(): string {
  return randomBytes(24).toString("hex");
}
