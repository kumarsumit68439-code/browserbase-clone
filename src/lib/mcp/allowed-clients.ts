/** Only these MCP / OAuth clients may connect */
export const ALLOWED_MCP_CLIENTS = [
  { id: "chatgpt", names: ["chatgpt", "openai", "chat.openai", "chatgpt-desktop"] },
  { id: "claude", names: ["claude", "anthropic", "claude.ai", "claude-desktop"] },
  { id: "gemini", names: ["gemini", "google", "google-gemini", "bard"] },
  { id: "grok", names: ["grok", "xai", "grok.x.ai", "x-ai"] },
  { id: "lovable", names: ["lovable", "lovable.dev"] },
  { id: "base44", names: ["base44", "base44.ai"] },
  { id: "cursor", names: ["cursor", "cursor.sh", "cursor-ide"] },
  { id: "codex", names: ["codex", "openai-codex", "chatgpt-codex"] },
] as const;

export function isAllowedMcpClient(input: {
  clientId?: string | null;
  clientName?: string | null;
  userAgent?: string | null;
}): { ok: true; client: string } | { ok: false; reason: string } {
  const hay = [input.clientId, input.clientName, input.userAgent]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!hay.trim()) {
    return { ok: false, reason: "Missing client_id / client_name. Only approved AI clients may connect." };
  }

  for (const c of ALLOWED_MCP_CLIENTS) {
    if (c.names.some((n) => hay.includes(n))) {
      return { ok: true, client: c.id };
    }
  }

  return {
    ok: false,
    reason:
      "Client not allowed. MCP access is restricted to: ChatGPT, Claude, Gemini, Grok, Lovable, Base44.ai, Cursor, Codex.",
  };
}
