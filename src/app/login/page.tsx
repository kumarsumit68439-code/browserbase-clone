"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const next = searchParams.get("next") || "/dashboard";

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setFormError(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setInfo("");
    if (!email.trim() || !password) {
      setFormError("Email and password required");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;

        // If session exists (email confirm disabled), go to app
        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      router.push(next);
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || "Authentication failed");
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
            Email · Password · Google
          </p>
        </div>
        <div className="card">
          <h2 style={{ textAlign: "center", fontSize: "1.1rem", marginBottom: "0.35rem" }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </h2>
          <p className="muted" style={{ textAlign: "center", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
            {mode === "signin" ? "Use email & password or Google" : "Register with email & password"}
          </p>

          {(error || formError) && (
            <p style={{ color: "#f87171", textAlign: "center", fontSize: "0.85rem", marginBottom: "1rem" }}>
              {formError || "Authentication failed. Try again."}
            </p>
          )}
          {info && (
            <p style={{ color: "#86efac", textAlign: "center", fontSize: "0.85rem", marginBottom: "1rem" }}>
              {info}
            </p>
          )}

          <form onSubmit={handleEmailAuth}>
            <label className="muted" style={{ fontSize: "0.75rem" }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={field}
              required
            />
            <label className="muted" style={{ fontSize: "0.75rem" }}>
              Password
            </label>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={field}
              required
              minLength={6}
            />
            <button className="btn btn-primary" style={{ width: "100%", marginBottom: 12 }} disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in with Email"
                  : "Sign up with Email"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.8rem", marginBottom: 16 }}>
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setFormError("");
                    setInfo("");
                  }}
                  style={{ color: "#a78bfa", background: "none", border: "none", cursor: "pointer" }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setFormError("");
                    setInfo("");
                  }}
                  style={{ color: "#a78bfa", background: "none", border: "none", cursor: "pointer" }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#27272a" }} />
            <span className="muted" style={{ fontSize: "0.75rem" }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: "#27272a" }} />
          </div>

          <button className="btn btn-white" style={{ width: "100%" }} onClick={handleGoogleLogin} disabled={loading}>
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  marginBottom: 12,
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#fff",
  fontSize: "0.9rem",
};

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
