import { NextRequest, NextResponse } from "next/server";

/** Alias: /token → proxy to /oauth/token */
async function proxy(req: NextRequest) {
  const target = new URL("/oauth/token", req.nextUrl.origin);
  const init: RequestInit = {
    method: req.method,
    headers: req.headers,
    duplex: "half",
  } as RequestInit;
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }
  const res = await fetch(target, init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  return proxy(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", error_description: "POST required" },
    { status: 405, headers: { Allow: "POST, OPTIONS" } }
  );
}
