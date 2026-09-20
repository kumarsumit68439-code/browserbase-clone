"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type AuthTab = "email" | "phone" | "google";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<AuthTab>("email");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const next = searchParams.get("next") || "/dashboard";

  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    // Default India country code if 10-digit local number
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;
    return digits.startsWith("+") ? digits : `+${digits}`;
  };

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

  const sendPhoneOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError("");
    setInfo("");
    const phoneE164 = normalizePhone(phone);
    if (!/^\+\d{10,15}$/.test(phoneE164)) {
      setFormError("Enter a valid phone with country code (e.g. +919876543210)");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneE164,
      });
      if (error) throw error;
      setPhone(phoneE164);
      setOtpSent(true);
      setInfo(`OTP sent to ${phoneE164}`);
    } catch (err: any) {
      setFormError(
        err?.message ||
          "Phone OTP failed. Enable Phone provider + SMS (Twilio) in Supabase Auth settings."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setInfo("");
    const phoneE164 = normalizePhone(phone);
    if (!otp.trim() || otp.trim().length < 4) {
      setFormError("Enter the OTP code");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneE164,
        token: otp.trim(),
        type: "sms",
      });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || "Invalid OTP");
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
            Email · Phone · Google
          </p>
        </div>
        <div className="card">
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(
              [
                { id: "email" as const, label: "Email" },
                { id: "phone" as const, label: "Phone" },
                { id: "google" as const, label: "Google" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? "btn btn-primary" : "btn btn-white"}
                style={{ flex: 1, fontSize: "0.8rem", padding: "0.5rem" }}
                onClick={() => {
                  setTab(t.id);
                  setFormError("");
                  setInfo("");
                  setOtpSent(false);
                  setOtp("");
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

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

          {tab === "email" && (
            <>
              <h2 style={{ textAlign: "center", fontSize: "1rem", marginBottom: "0.75rem" }}>
                {mode === "signin" ? "Sign in with Email" : "Sign up with Email"}
              </h2>
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
                  {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>
              <p style={{ textAlign: "center", fontSize: "0.8rem" }}>
                {mode === "signin" ? (
                  <>
                    No account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setFormError("");
                      }}
                      style={{ color: "#a78bfa", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setFormError("");
                      }}
                      style={{ color: "#a78bfa", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}

          {tab === "phone" && (
            <>
              <h2 style={{ textAlign: "center", fontSize: "1rem", marginBottom: "0.75rem" }}>
                Sign in with Phone
              </h2>
              {!otpSent ? (
                <form onSubmit={sendPhoneOtp}>
                  <label className="muted" style={{ fontSize: "0.75rem" }}>
                    Phone number
                  </label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    style={field}
                    required
                  />
                  <p className="muted" style={{ fontSize: "0.7rem", marginBottom: 12 }}>
                    Country code required. 10-digit India numbers auto-use +91.
                  </p>
                  <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                    {loading ? "Sending…" : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyPhoneOtp}>
                  <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
                    Code sent to <strong style={{ color: "#fff" }}>{phone}</strong>
                  </p>
                  <label className="muted" style={{ fontSize: "0.75rem" }}>
                    OTP code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    style={field}
                    required
                  />
                  <button className="btn btn-primary" style={{ width: "100%", marginBottom: 10 }} disabled={loading}>
                    {loading ? "Verifying…" : "Verify & Sign in"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-white"
                    style={{ width: "100%" }}
                    disabled={loading}
                    onClick={() => sendPhoneOtp()}
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: 10,
                      background: "none",
                      border: "none",
                      color: "#a1a1aa",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setInfo("");
                    }}
                  >
                    Change number
                  </button>
                </form>
              )}
            </>
          )}

          {tab === "google" && (
            <>
              <h2 style={{ textAlign: "center", fontSize: "1rem", marginBottom: "1rem" }}>
                Continue with Google
              </h2>
              <button className="btn btn-white" style={{ width: "100%" }} onClick={handleGoogleLogin} disabled={loading}>
                {loading ? "Redirecting..." : "Sign in with Google"}
              </button>
            </>
          )}
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
