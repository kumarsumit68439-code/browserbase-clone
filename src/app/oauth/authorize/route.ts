import { NextRequest, NextResponse } from "next/server";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";

function handleAuthorize(req: NextRequest) {
  const url = req.nextUrl;
  const clientId = url.searchParams.get("client_id") || "";
  const redirectUri = url.searchParams.get("redirect_uri") || "";
  const state = url.searchParams.get("state") || "";
  const scope = url.searchParams.get("scope") || "mcp";
  const codeChallenge = url.searchParams.get("code_challenge") || "";
  const codeChallengeMethod = url.searchParams.get("code_challenge_method") || "plain";
  const clientName = url.searchParams.get("client_name") || clientId;

  const check = isAllowedMcpClient({
    clientId,
    clientName,
    userAgent: req.headers.get("user-agent"),
  });

  if (!check.ok) {
    return NextResponse.json(
      { error: "unauthorized_client", error_description: check.reason },
      { status: 403 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "redirect_uri required" },
      { status: 400 }
    );
  }

  const approve = new URL("/oauth/approve", url.origin);
  approve.searchParams.set("client_id", clientId);
  approve.searchParams.set("client_name", clientName || check.client);
  approve.searchParams.set("allowed_client", check.client);
  approve.searchParams.set("redirect_uri", redirectUri);
  approve.searchParams.set("state", state);
  approve.searchParams.set("scope", scope);
  approve.searchParams.set("code_challenge", codeChallenge);
  approve.searchParams.set("code_challenge_method", codeChallengeMethod);

  return NextResponse.redirect(approve.toString());
}

export async function GET(req: NextRequest) {
  return handleAuthorize(req);
}

export async function POST(req: NextRequest) {
  // Some clients POST form fields instead of query string
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const url = req.nextUrl.clone();
    form.forEach((v, k) => url.searchParams.set(k, String(v)));
    return handleAuthorize(new NextRequest(url, { headers: req.headers }));
  }
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const url = req.nextUrl.clone();
    Object.entries(body || {}).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });
    return handleAuthorize(new NextRequest(url, { headers: req.headers }));
  }
  return handleAuthorize(req);
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
