import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <div className="header-inner">
          <strong style={{ fontSize: "1rem" }}>BrowserBase</strong>
          <Link href="/login" className="btn btn-white" style={{ padding: "0.45rem 0.9rem", minHeight: 40, fontSize: "0.85rem" }}>
            Sign in
          </Link>
        </div>
      </header>
      <main className="hero" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 560 }}>
          <h1>Give your agents access to the whole web</h1>
          <p>
            Cloud headless browsers, sessions, and API keys — built for mobile and desktop.
          </p>
          <Link href="/login" className="btn btn-primary">
            Get started free
          </Link>
        </div>
      </main>
    </div>
  );
}
