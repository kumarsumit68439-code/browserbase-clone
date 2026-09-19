import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <div className="header-inner">
          <strong>BrowserBase</strong>
          <Link href="/login" className="btn btn-white" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            Sign in
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: 640, textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "1rem" }}>
            Give your agents access to the whole web
          </h1>
          <p className="muted" style={{ marginBottom: "2rem" }}>
            Cloud headless browsers, sessions, API keys.
          </p>
          <Link href="/login" className="btn btn-primary">
            Get started free
          </Link>
        </div>
      </main>
    </div>
  );
}
