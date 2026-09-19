import { NextRequest, NextResponse } from "next/server";
import { signPayload, randomCode } from "@/lib/mcp/oauth-crypto";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";
import { normalizeChallengeMethod } from "@/lib/mcp/pkce";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const decision = String(form.get("decision") || "");
  const redirectUri = String(form.get("redirect_uri") || "");
  const state = String(form.get("state") || "");

  if (!redirectUri) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(redirectUri);
  } catch {
    return NextResponse.json({ error: "invalid_request", error_description: "bad redirect_uri" }, { status: 400 });
  }

  if (decision !== "approve") {
    target.searchParams.set("error", "access_denied");
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target.toString());
  }

  const clientId = String(form.get("client_id") || "");
  const clientName = String(form.get("client_name") || "");
  const allowedClient = String(form.get("allowed_client") || "");
  const userId = String(form.get("user_id") || "");
  const scope = String(form.get("scope") || "mcp");
  const codeChallenge = String(form.get("code_challenge") || "");
  const codeChallengeMethod = normalizeChallengeMethod(
    String(form.get("code_challenge_method") || "S256")
  );
  const resource = String(form.get("resource") || "");

  const check = isAllowedMcpClient({
    clientId,
    clientName,
    userAgent: allowedClient,
  });
  const clientLabel = check.ok ? check.client : allowedClient || clientId || "mcp";

  if (!userId) {
    target.searchParams.set("error", "login_required");
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target.toString());
  }

  if (!codeChallenge) {
    target.searchParams.set("error", "invalid_request");
    target.searchParams.set("error_description", "PKCE code_challenge missing");
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target.toString());
  }

  // Authorization code binds PKCE challenge + user + client + redirect
  const code = signPayload(
    {
      typ: "auth_code",
      sub: userId,
      client_id: clientId,
      client: clientLabel,
      scope,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      resource: resource || undefined,
      jti: randomCode(),
    },
    300 // 5 minutes
  );

  target.searchParams.set("code", code);
  if (state) target.searchParams.set("state", state);
  return NextResponse.redirect(target.toString());
}
