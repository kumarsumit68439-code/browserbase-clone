import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

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
    <div style={{ minHeight: "100vh" }}>
      <header className="header">
        <div className="header-inner">
          <Link href="/dashboard"><strong>BrowserBase</strong></Link>
          <Link href="/dashboard" className="muted" style={{ fontSize: "0.875rem" }}>← Dashboard</Link>
        </div>
      </header>
      <main className="container" style={{ paddingTop: "2.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Session</h1>
        <p className="mono muted" style={{ marginBottom: "1.5rem" }}>{session.id}</p>
        <div className="grid-2">
          <div className="card">
            <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>Status</p>
            <span className="badge">{session.status}</span>
            <p className="muted" style={{ fontSize: "0.875rem", marginTop: "1rem" }}>Region: {session.region}</p>
          </div>
          <div className="card">
            <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>Connect URL (real Browserless)</p>
            <code className="mono" style={{ display: "block", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "0.75rem", color: "#c4b5fd" }}>
              {session.connect_url || "N/A"}
            </code>
          </div>
        </div>
      </main>
    </div>
  );
}
