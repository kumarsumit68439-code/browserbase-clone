import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, signPayload, randomCode } from "@/lib/mcp/oauth-crypto";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";
import { verifyClientSecret } from "@/lib/mcp/clients";
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
    { error: "method_not_allowed", error_description: "Use POST" },
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

  // Basic auth header support
  const authHeader = req.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
      const [id, secret] = decoded.split(":");
      if (id && !body.client_id) body.client_id = id;
      if (secret && !body.client_secret) body.client_secret = secret;
    } catch {}
  }

  const grantType = body.grant_type;
  const clientId = body.client_id || "";
  const clientSecret = body.client_secret || "";
  const clientName = body.client_name || clientId;

  if (clientId && !verifyClientSecret(clientId, clientSecret)) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Bad client_secret" },
      { status: 401, headers: cors }
    );
  }

  const check = isAllowedMcpClient({
    clientId,
    clientName,
    userAgent: req.headers.get("user-agent"),
  });
  if (!check.ok && clientId) {
    return NextResponse.json(
      { error: "unauthorized_client", error_description: check.reason },
      { status: 403, headers: cors }
    );
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
        { error: "invalid_grant", error_description: "Invalid or expired code" },
        { status: 400, headers: cors }
      );
    }

    if (redirectUri && payload.redirect_uri && redirectUri !== payload.redirect_uri) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "redirect_uri mismatch" },
        { status: 400, headers: cors }
      );
    }

    // PKCE: if challenge was set at authorize, verifier required
    if (payload.code_challenge) {
      if (!codeVerifier) {
        return NextResponse.json(
          { error: "invalid_request", error_description: "code_verifier required" },
          { status: 400, headers: cors }
        );
      }
      if (!verifyPkce(codeVerifier, payload.code_challenge, payload.code_challenge_method)) {
        return NextResponse.json(
          { error: "invalid_grant", error_description: "PKCE verification failed" },
          { status: 400, headers: cors }
        );
      }
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

  // Client credentials (simple machine token for fixed clients — optional)
  if (grantType === "client_credentials") {
    if (!clientId || !verifyClientSecret(clientId, clientSecret) || !clientSecret) {
      return NextResponse.json({ error: "invalid_client" }, { status: 401, headers: cors });
    }
    const accessToken = signPayload(
      {
        typ: "access",
        sub: `client:${clientId}`,
        client: check.ok ? check.client : clientId,
        scope: body.scope || "mcp",
        jti: randomCode(),
      },
      3600
    );
    return NextResponse.json(
      { access_token: accessToken, token_type: "Bearer", expires_in: 3600, scope: body.scope || "mcp" },
      { headers: cors }
    );
  }

  return NextResponse.json(
    { error: "unsupported_grant_type" },
    { status: 400, headers: cors }
  );
}
