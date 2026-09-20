import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <Link href="/" style={{ color: "#a78bfa", fontSize: "0.85rem" }}>
        ← Home
      </Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "1rem 0" }}>Terms of Service</h1>
      <p className="muted" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Last updated: September 2026
      </p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>1. Account responsibility</h2>
        <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
          You are responsible for safeguarding API keys, passwords, and OTP codes. Activity performed with your keys is
          treated as authorized by you. Revoke compromised keys immediately.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>2. Acceptable use</h2>
        <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
          Do not use the service to attack systems, distribute malware, scrape personal data unlawfully, or bypass rate
          limits and access controls. Abuse may result in key revocation or account suspension.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>3. Data ownership</h2>
        <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
          Content and configuration you store (documents, sessions metadata, storage objects) remain yours. The platform
          processes data only to provide the service. Private data is intended for the account owner only.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>4. No warranty</h2>
        <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
          The service is provided as-is. Availability of third-party models, browsers, or SMS providers may change
          without notice.
        </p>
      </div>

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/privacy" style={{ color: "#a78bfa" }}>
          Privacy Policy →
        </Link>
      </p>
    </div>
  );
}
