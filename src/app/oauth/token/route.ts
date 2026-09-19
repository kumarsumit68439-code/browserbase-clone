import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, signPayload, randomCode } from "@/lib/mcp/oauth-crypto";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";
import { verifyPkce } from "@/lib/mcp/pkce";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: "POST, OPTIONS", ...cors } });
}

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", error_description: "Use POST on the token endpoint" },
    { status: 405, headers: { Allow: "POST, OPTIONS", ...cors } }
  );
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let body: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  } else {
    try {
      const form = await req.formData();
      form.forEach((v, k) => {
        body[k] = String(v);
      });
    } catch {
      body = {};
    }
  }

  const grantType = body.grant_type;
  const clientId = body.client_id || "";
  const clientName = body.client_name || clientId;

  // Public PKCE clients often send client_id only (token_endpoint_auth_method=none)
  if (clientId) {
    const check = isAllowedMcpClient({
      clientId,
      clientName,
      userAgent: req.headers.get("user-agent"),
    });
    // Soft: allow token exchange if auth code is valid even when client string is custom
    if (!check.ok && !body.code && !body.refresh_token) {
      return NextResponse.json(
        { error: "unauthorized_client", error_description: check.reason },
        { status: 403, headers: cors }
      );
    }
  }

  if (grantType === "authorization_code") {
    const code = body.code || "";
    const redirectUri = body.redirect_uri || "";
    const codeVerifier = body.code_verifier || "";

    const payload = verifyPayload<{
      typ: string;
      sub: string;
      client_id: string;
      client: string;
      scope: string;
      redirect_uri: string;
      code_challenge: string;
      code_challenge_method: string;
      resource?: string;
    }>(code);

    if (!payload || payload.typ !== "auth_code") {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Invalid or expired authorization code" },
        { status: 400, headers: cors }
      );
    }

    if (redirectUri && payload.redirect_uri && redirectUri !== payload.redirect_uri) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "redirect_uri mismatch" },
        { status: 400, headers: cors }
      );
    }

    // Real PKCE: code_verifier MUST match code_challenge from authorize
    if (!payload.code_challenge) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Authorization code missing PKCE binding" },
        { status: 400, headers: cors }
      );
    }
    if (!codeVerifier) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "code_verifier required (PKCE). Use token_endpoint_auth_method=none with PKCE.",
        },
        { status: 400, headers: cors }
      );
    }
    if (!verifyPkce(codeVerifier, payload.code_challenge, payload.code_challenge_method)) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "PKCE verification failed (S256)" },
        { status: 400, headers: cors }
      );
    }

    const accessToken = signPayload(
      {
        typ: "access",
        sub: payload.sub,
        client: payload.client,
        scope: payload.scope,
        resource: payload.resource,
        jti: randomCode(),
      },
      3600 * 8
    );
    const refreshToken = signPayload(
      {
        typ: "refresh",
        sub: payload.sub,
        client: payload.client,
        scope: payload.scope,
        jti: randomCode(),
      },
      3600 * 24 * 30
    );

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600 * 8,
        refresh_token: refreshToken,
        scope: payload.scope,
      },
      { headers: cors }
    );
  }

  if (grantType === "refresh_token") {
    const refresh = verifyPayload<{ typ: string; sub: string; client: string; scope: string }>(
      body.refresh_token || ""
    );
    if (!refresh || refresh.typ !== "refresh") {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400, headers: cors });
    }
    const accessToken = signPayload(
      {
        typ: "access",
        sub: refresh.sub,
        client: refresh.client,
        scope: refresh.scope,
        jti: randomCode(),
      },
      3600 * 8
    );
    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600 * 8,
        scope: refresh.scope,
      },
      { headers: cors }
    );
  }

  return NextResponse.json(
    { error: "unsupported_grant_type", error_description: "Use authorization_code or refresh_token" },
    { status: 400, headers: cors }
  );
}
