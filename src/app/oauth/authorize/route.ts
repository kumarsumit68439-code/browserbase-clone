import { NextRequest, NextResponse } from "next/server";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";
import { normalizeChallengeMethod } from "@/lib/mcp/pkce";

function handleAuthorize(req: NextRequest) {
  const url = req.nextUrl;
  const clientId = url.searchParams.get("client_id") || "";
  const redirectUri = url.searchParams.get("redirect_uri") || "";
  const state = url.searchParams.get("state") || "";
  const scope = url.searchParams.get("scope") || "mcp";
  const responseType = url.searchParams.get("response_type") || "code";
  const codeChallenge = url.searchParams.get("code_challenge") || "";
  const codeChallengeMethod = normalizeChallengeMethod(
    url.searchParams.get("code_challenge_method")
  );
  const clientName = url.searchParams.get("client_name") || clientId;
  const resource = url.searchParams.get("resource") || "";

  if (responseType !== "code") {
    return NextResponse.json(
      { error: "unsupported_response_type", error_description: "Only response_type=code is supported" },
      { status: 400 }
    );
  }

  const check = isAllowedMcpClient({
    clientId,
    clientName,
    userAgent: req.headers.get("user-agent"),
  });

  if (!check.ok) {
    // Still allow if client looks like MCP + has PKCE (public client)
    if (!codeChallenge) {
      return NextResponse.json(
        { error: "unauthorized_client", error_description: check.reason },
        { status: 403 }
      );
    }
  }

  if (!redirectUri) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "redirect_uri required" },
      { status: 400 }
    );
  }

  // PKCE required for public / MCP clients (token_endpoint_auth_method=none)
  if (!codeChallenge) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description:
          "PKCE required. Send code_challenge (S256) and later code_verifier on /oauth/token.",
      },
      { status: 400 }
    );
  }

  if (codeChallenge.length < 43 && codeChallengeMethod === "S256") {
    // S256 challenges are 43 chars base64url; plain can vary — soft check only for S256 shape
  }

  const allowedClient = check.ok ? check.client : clientId || "mcp-public";

  const approve = new URL("/oauth/approve", url.origin);
  approve.searchParams.set("client_id", clientId);
  approve.searchParams.set("client_name", clientName || allowedClient);
  approve.searchParams.set("allowed_client", allowedClient);
  approve.searchParams.set("redirect_uri", redirectUri);
  approve.searchParams.set("state", state);
  approve.searchParams.set("scope", scope);
  approve.searchParams.set("code_challenge", codeChallenge);
  approve.searchParams.set("code_challenge_method", codeChallengeMethod);
  if (resource) approve.searchParams.set("resource", resource);

  return NextResponse.redirect(approve.toString());
}

export async function GET(req: NextRequest) {
  return handleAuthorize(req);
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
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
