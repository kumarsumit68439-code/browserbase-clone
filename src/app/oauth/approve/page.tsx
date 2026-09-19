import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApproveForm } from "./ApproveForm";

export const dynamic = "force-dynamic";

export default async function ApprovePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/oauth/approve?${new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v) as [string, string][]
    ).toString()}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const clientName = sp.client_name || sp.client_id || "Unknown client";
  const allowedClient = sp.allowed_client || "unknown";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div className="card login-card" style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>Authorize MCP access</h1>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 16 }}>
          <strong style={{ color: "#fff" }}>{clientName}</strong> ({allowedClient}) wants to access your
          BrowserBase workspace via MCP.
        </p>
        <ul className="muted" style={{ fontSize: "0.85rem", marginBottom: 16, paddingLeft: "1.2rem" }}>
          <li>API keys & Project ID</li>
          <li>Sessions (list / create / get)</li>
          <li>Docs, endpoints, code snippets</li>
          <li>Dashboard page data</li>
        </ul>
        <p className="muted" style={{ fontSize: "0.75rem", marginBottom: 16 }}>
          Signed in as {user.email}. Only ChatGPT, Claude, Gemini, Grok, Lovable, Base44, Cursor, Codex are
          allowed.
        </p>
        <ApproveForm
          clientId={sp.client_id || ""}
          clientName={clientName}
          allowedClient={allowedClient}
          redirectUri={sp.redirect_uri || ""}
          state={sp.state || ""}
          scope={sp.scope || "mcp"}
          codeChallenge={sp.code_challenge || ""}
          codeChallengeMethod={sp.code_challenge_method || "plain"}
          userId={user.id}
        />
      </div>
    </div>
  );
}
