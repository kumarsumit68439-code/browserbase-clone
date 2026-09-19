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
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
        <input type="hidden" name="user_id" value={props.userId} />
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
          Approve
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
