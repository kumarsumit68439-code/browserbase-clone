import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("bb_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) notFound();

  return (
    <AppShell email={user.email} active="/dashboard">
      <Link href="/dashboard" className="muted" style={{ fontSize: "0.875rem" }}>
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 8 }}>Session</h1>
      <p className="mono muted" style={{ marginBottom: "1.5rem" }}>
        {session.id}
      </p>
      <div className="grid-2">
        <div className="card">
          <p className="muted" style={{ fontSize: "0.875rem", marginBottom: 6 }}>
            Status
          </p>
          <span className="badge">{session.status}</span>
          <p className="muted" style={{ fontSize: "0.875rem", marginTop: 12 }}>
            Region: {session.region}
          </p>
        </div>
        <div className="card">
          <p className="muted" style={{ fontSize: "0.875rem", marginBottom: 6 }}>
            Connect URL (real Browserless)
          </p>
          <code
            className="mono"
            style={{
              display: "block",
              background: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: "0.75rem",
              color: "#c4b5fd",
              wordBreak: "break-all",
            }}
          >
            {session.connect_url || "N/A"}
          </code>
        </div>
      </div>
    </AppShell>
  );
}
