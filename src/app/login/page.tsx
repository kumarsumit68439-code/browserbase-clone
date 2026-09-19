"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>BrowserBase</h1>
          <p className="muted" style={{ fontSize: "0.875rem" }}>Cloud browsers for AI agents</p>
        </div>
        <div className="card">
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Sign in</h2>
          <p className="muted" style={{ textAlign: "center", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Get your API key & start sessions
          </p>
          {error && (
            <p style={{ color: "#f87171", textAlign: "center", fontSize: "0.875rem", marginBottom: "1rem" }}>
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
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
