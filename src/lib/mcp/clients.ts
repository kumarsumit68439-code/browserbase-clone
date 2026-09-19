/** Fixed OAuth clients for MCP Custom Connectors (working credentials) */

export type FixedClient = {
  client_id: string;
  client_secret: string;
  name: string;
  redirect_uri_prefixes?: string[];
};

/**
 * Use these exact values in ChatGPT / Claude / Cursor Custom Connector forms.
 * Secret can be overridden with env MCP_OAUTH_CLIENT_SECRET (same for all).
 */
const sharedSecret =
  process.env.MCP_OAUTH_CLIENT_SECRET || "bb_mcp_connect_secret_live_2026";

export const FIXED_MCP_CLIENTS: FixedClient[] = [
  { client_id: "bb_mcp_chatgpt", client_secret: sharedSecret, name: "chatgpt" },
  { client_id: "bb_mcp_claude", client_secret: sharedSecret, name: "claude" },
  { client_id: "bb_mcp_gemini", client_secret: sharedSecret, name: "gemini" },
  { client_id: "bb_mcp_grok", client_secret: sharedSecret, name: "grok" },
  { client_id: "bb_mcp_cursor", client_secret: sharedSecret, name: "cursor" },
  { client_id: "bb_mcp_codex", client_secret: sharedSecret, name: "codex" },
  { client_id: "bb_mcp_lovable", client_secret: sharedSecret, name: "lovable" },
  { client_id: "bb_mcp_base44", client_secret: sharedSecret, name: "base44" },
  // aliases clients often send
  { client_id: "chatgpt", client_secret: sharedSecret, name: "chatgpt" },
  { client_id: "claude", client_secret: sharedSecret, name: "claude" },
  { client_id: "cursor", client_secret: sharedSecret, name: "cursor" },
  { client_id: "openai", client_secret: sharedSecret, name: "chatgpt" },
  { client_id: "anthropic", client_secret: sharedSecret, name: "claude" },
];

export function findFixedClient(clientId?: string | null): FixedClient | null {
  if (!clientId) return null;
  const id = clientId.trim().toLowerCase();
  return FIXED_MCP_CLIENTS.find((c) => c.client_id.toLowerCase() === id) || null;
}

export function verifyClientSecret(clientId: string, secret?: string | null): boolean {
  const fixed = findFixedClient(clientId);
  if (!fixed) return true; // public PKCE-only clients
  if (!secret) return true; // allow PKCE without secret (token_endpoint_auth_method=none)
  return secret === fixed.client_secret || secret === sharedSecret;
}
