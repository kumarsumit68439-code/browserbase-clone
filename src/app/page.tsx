import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BrowserChrome — Cloud Browser for AI Agents",
  description:
    "BrowserChrome: search and run cloud headless Chrome, browser sessions, API keys, MCP, and backend for AI agents. Free to start.",
  keywords: ["BrowserChrome", "Browser Chrome", "cloud browser", "headless chrome", "AI browser"],
};

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <div className="header-inner">
          <strong style={{ fontSize: "1rem" }}>BrowserChrome</strong>
          <nav style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/docs" className="muted" style={{ fontSize: "0.85rem" }}>
              Docs
            </Link>
            <Link href="/privacy" className="muted" style={{ fontSize: "0.85rem" }}>
              Privacy
            </Link>
            <Link href="/login" className="btn btn-white" style={{ padding: "0.45rem 0.9rem", minHeight: 40, fontSize: "0.85rem" }}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="hero" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 640 }}>
          <h1>BrowserChrome — cloud browsers for AI agents</h1>
          <p>
            BrowserChrome gives your agents real headless Chrome in the cloud: sessions, API keys, realtime database,
            SQL, MCP OAuth, and backend APIs — on mobile and desktop.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <Link href="/login" className="btn btn-primary">
              Get started free
            </Link>
            <Link href="/docs" className="btn btn-white">
              Read the docs
            </Link>
          </div>
          <section style={{ marginTop: "2.5rem", textAlign: "left" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>Why BrowserChrome?</h2>
            <ul className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.6, paddingLeft: "1.2rem" }}>
              <li>Cloud headless Chrome sessions with connect URLs</li>
              <li>Project ID &amp; API keys generated on signup</li>
              <li>Realtime database, SQL editor, and storage</li>
              <li>MCP server with OAuth for Claude, ChatGPT, Cursor</li>
              <li>AI playground with free open models</li>
            </ul>
          </section>
        </div>
      </main>
      <footer style={{ padding: "1.5rem", textAlign: "center", borderTop: "1px solid #27272a" }}>
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          © {new Date().getFullYear()} BrowserChrome ·{" "}
          <Link href="/privacy" style={{ color: "#a78bfa" }}>
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" style={{ color: "#a78bfa" }}>
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
}
