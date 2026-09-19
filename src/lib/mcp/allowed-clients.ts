import { findFixedClient } from "./clients";

/** Only these MCP / OAuth clients may connect */
export const ALLOWED_MCP_CLIENTS = [
  { id: "chatgpt", names: ["chatgpt", "openai", "chat.openai", "chatgpt-desktop", "bb_mcp_chatgpt"] },
  { id: "claude", names: ["claude", "anthropic", "claude.ai", "claude-desktop", "bb_mcp_claude"] },
  { id: "gemini", names: ["gemini", "google", "google-gemini", "bard", "bb_mcp_gemini"] },
  { id: "grok", names: ["grok", "xai", "grok.x.ai", "x-ai", "bb_mcp_grok"] },
  { id: "lovable", names: ["lovable", "lovable.dev", "bb_mcp_lovable"] },
  { id: "base44", names: ["base44", "base44.ai", "bb_mcp_base44"] },
  { id: "cursor", names: ["cursor", "cursor.sh", "cursor-ide", "bb_mcp_cursor"] },
  { id: "codex", names: ["codex", "openai-codex", "chatgpt-codex", "bb_mcp_codex"] },
] as const;

export function isAllowedMcpClient(input: {
  clientId?: string | null;
  clientName?: string | null;
  userAgent?: string | null;
}): { ok: true; client: string } | { ok: false; reason: string } {
  // Fixed registered clients always OK
  const fixed = findFixedClient(input.clientId);
  if (fixed) return { ok: true, client: fixed.name };

  const hay = [input.clientId, input.clientName, input.userAgent]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!hay.trim()) {
    // Allow empty during some discovery probes — treat as public mcp
    return { ok: true, client: "mcp-public" };
  }

  for (const c of ALLOWED_MCP_CLIENTS) {
    if (c.names.some((n) => hay.includes(n))) {
      return { ok: true, client: c.id };
    }
  }

  // Dynamic client ids from DCR (uuid-like) — allow if UA looks like AI product
  if (/^[a-z0-9_-]{8,}$/i.test(input.clientId || "")) {
    return { ok: true, client: input.clientId || "dynamic" };
  }

  return {
    ok: false,
    reason:
      "Client not allowed. Use client_id=bb_mcp_chatgpt (or claude/cursor…) with the published client_secret.",
  };
}
