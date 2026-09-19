import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { verifyPayload, signPayload, randomCode } from "@/lib/mcp/oauth-crypto";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";

function verifyPkce(verifier: string, challenge: string, method: string) {
  if (!challenge) return true;
  if (method === "S256") {
    const hash = createHash("sha256").update(verifier).digest("base64url");
    return hash === challenge;
  }
  return verifier === challenge;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let body: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    body = await req.json();
  } else {
    const form = await req.formData();
    form.forEach((v, k) => {
      body[k] = String(v);
    });
  }

  const grantType = body.grant_type;
  const clientId = body.client_id || "";
  const clientName = body.client_name || clientId;

  const check = isAllowedMcpClient({
    clientId,
    clientName,
    userAgent: req.headers.get("user-agent"),
  });
  if (!check.ok) {
    return NextResponse.json({ error: "unauthorized_client", error_description: check.reason }, { status: 403 });
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
    }>(code);

    if (!payload || payload.typ !== "auth_code") {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    if (redirectUri && payload.redirect_uri && redirectUri !== payload.redirect_uri) {
      return NextResponse.json({ error: "invalid_grant", error_description: "redirect_uri mismatch" }, { status: 400 });
    }
    if (!verifyPkce(codeVerifier, payload.code_challenge, payload.code_challenge_method)) {
      return NextResponse.json({ error: "invalid_grant", error_description: "pkce failed" }, { status: 400 });
    }

    const accessToken = signPayload(
      {
        typ: "access",
        sub: payload.sub,
        client: payload.client,
        scope: payload.scope,
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

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600 * 8,
      refresh_token: refreshToken,
      scope: payload.scope,
    });
  }

  if (grantType === "refresh_token") {
    const refresh = verifyPayload<{ typ: string; sub: string; client: string; scope: string }>(
      body.refresh_token || ""
    );
    if (!refresh || refresh.typ !== "refresh") {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
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
    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600 * 8,
      scope: refresh.scope,
    });
  }

  return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
}
