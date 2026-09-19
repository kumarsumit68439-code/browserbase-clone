import { NextRequest, NextResponse } from "next/server";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";
import { FIXED_MCP_CLIENTS, findFixedClient } from "@/lib/mcp/clients";
import { randomCode } from "@/lib/mcp/oauth-crypto";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/** List fixed credentials for Custom Connector setup */
export async function GET() {
  return NextResponse.json(
    {
      clients: FIXED_MCP_CLIENTS.map((c) => ({
        client_id: c.client_id,
        client_secret: c.client_secret,
        name: c.name,
      })),
      note: "Use client_id + client_secret in MCP Custom Connector. Token auth: client_secret_post or none (PKCE).",
    },
    { headers: cors }
  );
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const clientName = body.client_name || body.clientName || "";
  const requestedId = body.client_id || "";

  // Return fixed client if matches
  const fixed = findFixedClient(requestedId) || findFixedClient(clientName);
  if (fixed) {
    return NextResponse.json(
      {
        client_id: fixed.client_id,
        client_secret: fixed.client_secret,
        client_name: fixed.name,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "client_secret_post",
        redirect_uris: body.redirect_uris || [],
      },
      { headers: cors }
    );
  }

  const check = isAllowedMcpClient({
    clientId: requestedId,
    clientName,
    userAgent: req.headers.get("user-agent"),
  });

  if (!check.ok) {
    return NextResponse.json(
      { error: "unauthorized_client", error_description: check.reason },
      { status: 403, headers: cors }
    );
  }

  const clientId = requestedId || `bb_mcp_${check.client}_${randomCode().slice(0, 8)}`;
  const clientSecret = process.env.MCP_OAUTH_CLIENT_SECRET || "bb_mcp_connect_secret_live_2026";

  return NextResponse.json(
    {
      client_id: clientId,
      client_secret: clientSecret,
      client_name: clientName || check.client,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
      redirect_uris: body.redirect_uris || [],
    },
    { headers: cors }
  );
}
