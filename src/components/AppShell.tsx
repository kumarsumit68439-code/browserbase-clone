"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";

const nav = [
  {
    title: "Account",
    items: [
      { href: "/dashboard", label: "Home" },
      { href: "/api-keys", label: "API Keys" },
      { href: "/ai-keys", label: "AI API Keys" },
      { href: "/users", label: "Users" },
      { href: "/email-alerts", label: "Email Alerts" },
    ],
  },
  {
    title: "Playgrounds",
    items: [
      { href: "/playgrounds/ai", label: "AI Playground" },
      { href: "/playgrounds/browserql", label: "BrowserQL" },
      { href: "/playgrounds/baas-debugger", label: "BaaS Debugger" },
      { href: "/playgrounds/rest", label: "REST Playground" },
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
    items: [
      { href: "/docs", label: "API Docs" },
      { href: "/docs/mcp", label: "MCP Connect" },
    ],
  },
];

function NavLinks({
  active,
  onNavigate,
}: {
  active?: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {nav.map((section) => (
        <div key={section.title} className="nav-section">
          <div className="nav-section-title">{section.title}</div>
          {section.items.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`nav-link${isActive ? " active" : ""}`}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function AppShell({
  children,
  email,
  active,
}: {
  children: ReactNode;
  email?: string | null;
  active?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="mobile-bar mobile-only">
        <button type="button" className="menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
          ☰
        </button>
        <span className="mobile-bar-title">BrowserBase</span>
        <span className="mobile-email" title={email || ""}>
          {email || ""}
        </span>
      </div>

      <div className={`drawer-backdrop${open ? " open" : ""}`} onClick={() => setOpen(false)} aria-hidden={!open} />
      <nav className={`drawer${open ? " open" : ""}`} aria-label="Mobile navigation">
        <button type="button" className="drawer-close" onClick={() => setOpen(false)}>
          Close ✕
        </button>
        <div className="sidebar-brand">BrowserBase</div>
        <NavLinks active={active} onNavigate={() => setOpen(false)} />
        <form action="/auth/signout" method="post" style={{ padding: "0.75rem" }}>
          <button type="submit" className="btn btn-white" style={{ width: "100%" }}>
            Sign out
          </button>
        </form>
      </nav>

      <div className="app-body">
        <aside className="sidebar desktop-only">
          <div className="sidebar-brand">BrowserBase</div>
          <NavLinks active={active} />
        </aside>

        <div className="app-main">
          <header className="header desktop-only">
            <div className="header-inner" style={{ maxWidth: "none" }}>
              <span className="muted header-tagline" style={{ fontSize: "0.875rem" }}>
                AI Playground · keys · MCP
              </span>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <span className="muted" style={{ fontSize: "0.875rem" }}>
                  {email}
                </span>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="muted" style={{ fontSize: "0.875rem" }}>
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </header>
          <div className="container app-main-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
