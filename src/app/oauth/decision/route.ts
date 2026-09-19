import { NextRequest, NextResponse } from "next/server";
import { signPayload, randomCode } from "@/lib/mcp/oauth-crypto";
import { isAllowedMcpClient } from "@/lib/mcp/allowed-clients";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const decision = String(form.get("decision") || "");
  const redirectUri = String(form.get("redirect_uri") || "");
  const state = String(form.get("state") || "");

  if (!redirectUri) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const target = new URL(redirectUri);

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
  const codeChallengeMethod = String(form.get("code_challenge_method") || "plain");

  const check = isAllowedMcpClient({ clientId, clientName, userAgent: allowedClient });
  if (!check.ok) {
    target.searchParams.set("error", "unauthorized_client");
    target.searchParams.set("error_description", check.reason);
    return NextResponse.redirect(target.toString());
  }

  if (!userId) {
    target.searchParams.set("error", "login_required");
    return NextResponse.redirect(target.toString());
  }

  const code = signPayload(
    {
      typ: "auth_code",
      sub: userId,
      client_id: clientId,
      client: check.client,
      scope,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      jti: randomCode(),
    },
    300
  );

  target.searchParams.set("code", code);
  if (state) target.searchParams.set("state", state);
  return NextResponse.redirect(target.toString());
}
