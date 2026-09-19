import Link from "next/link";
import { ReactNode } from "react";

const nav = [
  {
    title: "Account",
    items: [
      { href: "/dashboard", label: "Home" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/api-keys", label: "API Keys" },
      { href: "/users", label: "Users" },
      { href: "/email-alerts", label: "Email Alerts" },
    ],
  },
  {
    title: "Playgrounds",
    items: [
      { href: "/playgrounds/browserql", label: "BrowserQL Editor" },
      { href: "/playgrounds/baas-debugger", label: "BaaS Debugger" },
      { href: "/playgrounds/rest", label: "REST API Playground" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/tools/logs", label: "Logs" },
      { href: "/tools/code-generator", label: "Code Generator" },
    ],
  },
  {
    title: "Docs",
    items: [{ href: "/docs", label: "API Documentation" }],
  },
];

export function AppShell({
  children,
  email,
  active,
}: {
  children: ReactNode;
  email?: string | null;
  active?: string;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside
        style={{
          width: 240,
          borderRight: "1px solid #27272a",
          background: "#09090b",
          padding: "1.25rem 0.75rem",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 0.75rem 1.25rem", fontWeight: 700, fontSize: "1.05rem" }}>
          BrowserBase
        </div>
        {nav.map((section) => (
          <div key={section.title} style={{ marginBottom: "1.25rem" }}>
            <div
              className="muted"
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "0 0.75rem",
                marginBottom: 6,
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = active === item.href || active === item.label;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "0.45rem 0.75rem",
                    borderRadius: 8,
                    fontSize: "0.875rem",
                    color: isActive ? "#fff" : "#a1a1aa",
                    background: isActive ? "#27272a" : "transparent",
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <header className="header">
          <div className="header-inner" style={{ maxWidth: "none" }}>
            <span className="muted" style={{ fontSize: "0.875rem" }}>
              Cloud browsers · real sessions
            </span>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span className="muted" style={{ fontSize: "0.875rem" }}>
                {email}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="muted"
                  style={{ background: "none", fontSize: "0.875rem" }}
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="container" style={{ paddingTop: "1.75rem", paddingBottom: "3rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
