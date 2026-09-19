import { NextResponse } from "next/server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/oauth/token`,
      registration_endpoint: `${origin}/oauth/register`,
      revocation_endpoint: `${origin}/oauth/token`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      // PKCE required for public clients (MCP connectors)
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
      scopes_supported: [
        "mcp",
        "openid",
        "sessions:read",
        "sessions:write",
        "keys:read",
        "project:read",
        "docs:read",
      ],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["none"],
      service_documentation: `${origin}/docs/mcp`,
      // MCP / OAuth resource indicators (RFC 8707)
      require_pkce: true,
      require_request_uri_registration: false,
    },
    { headers: cors }
  );
}
