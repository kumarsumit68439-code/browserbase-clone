import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: ["mcp", "sessions:read", "sessions:write", "keys:read", "project:read", "docs:read"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${origin}/docs/mcp`,
  });
}
