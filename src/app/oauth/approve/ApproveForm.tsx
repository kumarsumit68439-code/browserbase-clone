"use client";

export function ApproveForm(props: {
  clientId: string;
  clientName: string;
  allowedClient: string;
  redirectUri: string;
  state: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  userId: string;
  resource?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        className="muted"
        style={{
          fontSize: "0.75rem",
          padding: "0.6rem",
          background: "#09090b",
          borderRadius: 8,
          border: "1px solid #27272a",
        }}
      >
        PKCE: {props.codeChallengeMethod.toUpperCase()} · challenge{" "}
        <code className="mono">{props.codeChallenge ? `${props.codeChallenge.slice(0, 12)}…` : "missing"}</code>
      </div>
      <form action="/oauth/decision" method="POST">
        <input type="hidden" name="decision" value="approve" />
        <input type="hidden" name="client_id" value={props.clientId} />
        <input type="hidden" name="client_name" value={props.clientName} />
        <input type="hidden" name="allowed_client" value={props.allowedClient} />
        <input type="hidden" name="redirect_uri" value={props.redirectUri} />
        <input type="hidden" name="state" value={props.state} />
        <input type="hidden" name="scope" value={props.scope} />
        <input type="hidden" name="code_challenge" value={props.codeChallenge} />
        <input type="hidden" name="code_challenge_method" value={props.codeChallengeMethod} />
        <input type="hidden" name="resource" value={props.resource || ""} />
        <input type="hidden" name="user_id" value={props.userId} />
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
          Approve (PKCE)
        </button>
      </form>
      <form action="/oauth/decision" method="POST">
        <input type="hidden" name="decision" value="deny" />
        <input type="hidden" name="redirect_uri" value={props.redirectUri} />
        <input type="hidden" name="state" value={props.state} />
        <button type="submit" className="btn btn-white" style={{ width: "100%" }}>
          Deny
        </button>
      </form>
    </div>
  );
}
