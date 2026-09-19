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
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: ["mcp", "sessions:read", "sessions:write", "keys:read", "project:read", "docs:read"],
      bearer_methods_supported: ["header"],
      resource_documentation: `${origin}/docs/mcp`,
      resource_signing_alg_values_supported: [],
    },
    { headers: cors }
  );
}
