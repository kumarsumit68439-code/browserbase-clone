"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next") || "/dashboard";

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      console.error(error.message);
      setLoading(false);
    }
  };

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
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>BrowserBase</h1>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
            Sign in · MCP OAuth ready
          </p>
        </div>
        <div className="card">
          <h2 style={{ textAlign: "center", fontSize: "1.1rem", marginBottom: "0.35rem" }}>Sign in</h2>
          <p className="muted" style={{ textAlign: "center", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
            Approve AI clients after login
          </p>
          {error && (
            <p style={{ color: "#f87171", textAlign: "center", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Authentication failed. Try again.
            </p>
          )}
          <button className="btn btn-white" style={{ width: "100%" }} onClick={handleGoogleLogin} disabled={loading}>
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
