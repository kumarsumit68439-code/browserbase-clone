import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <Link href="/" style={{ color: "#a78bfa", fontSize: "0.85rem" }}>
        ← Home
      </Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "1rem 0" }}>Privacy Policy</h1>
      <p className="muted" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Last updated: September 2026 · BrowserBase Clone
      </p>

      <Section title="1. Who can see your data">
        API keys, projects, sessions, database documents, storage objects, and realtime data are private to the
        authenticated account owner. Other users and third parties cannot list or read your rows when logged in under
        their own account.
      </Section>

      <Section title="2. Cookies & third parties">
        We use essential session cookies for authentication (httpOnly, SameSite=Lax, Secure in production). We do not
        sell personal data. Third-party trackers are not intentionally embedded. OAuth providers (e.g. Google) process
        sign-in according to their own policies when you choose them.
      </Section>

      <Section title="3. API keys">
        Keys are stored in your project database and bound to your user id. You may reveal, revoke, or permanently
        delete keys from the API Keys page. Revoked keys are rejected by the API.
      </Section>

      <Section title="4. Security measures">
        Transport security (HTTPS), security response headers (CSP, X-Frame-Options, nosniff), private cache headers on
        account pages, and server-side authorization checks on API routes. Database Row Level Security restricts access
        to owner rows for interactive sessions.
      </Section>

      <Section title="5. Your rights">
        You may export or delete data associated with your account by using product tools (keys delete, storage delete,
        SQL/table tools where available) or by contacting the site operator.
      </Section>

      <Section title="6. Contact">
        For privacy requests, contact the project owner via the account email used at signup.
      </Section>

      <p style={{ marginTop: "2rem" }}>
        <Link href="/terms" style={{ color: "#a78bfa" }}>
          Terms of Service →
        </Link>
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{title}</h2>
      <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  );
}
