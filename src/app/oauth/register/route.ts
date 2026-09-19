import { NextRequest, NextResponse } from "next/server";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";
import { randomCode } from "@/lib/mcp/oauth-crypto";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const clientName = body.client_name || body.clientName || "";
  const check = isAllowedMcpClient({
    clientId: body.client_id,
    clientName,
    userAgent: req.headers.get("user-agent"),
  });

  if (!check.ok) {
    return NextResponse.json({ error: "unauthorized_client", error_description: check.reason }, { status: 403 });
  }

  const clientId = body.client_id || `${check.client}_${randomCode().slice(0, 12)}`;
  const clientSecret = randomCode();

  return NextResponse.json({
    client_id: clientId,
    client_secret: clientSecret,
    client_name: clientName || check.client,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
    allowed_client: check.client,
  });
}
