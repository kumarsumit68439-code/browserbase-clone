import { NextRequest, NextResponse } from "next/server";

/** Alias: /authorize → /oauth/authorize (some MCP clients omit /oauth prefix) */
export async function GET(req: NextRequest) {
  const url = new URL("/oauth/authorize", req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  return NextResponse.redirect(url.toString());
}

export async function POST(req: NextRequest) {
  const url = new URL("/oauth/authorize", req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  // Forward method as GET redirect with query (authorize handler also accepts POST)
  return NextResponse.redirect(url.toString(), 307);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
