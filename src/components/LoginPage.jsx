import { useState } from "react";
import { theme } from "../theme";
import * as api from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await api.signIn(email, password);
      // onAuthStateChange in App.jsx will update the session automatically.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await api.signUp(email, password);
      setInfo("Check your email to confirm your account, then sign in.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: theme.surface,
          borderRadius: theme.radius,
          border: `1px solid ${theme.border}`,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 380,
        }}
      >
        <h1
          className="display"
          style={{
            margin: "0 0 8px",
            fontSize: 28,
            fontWeight: 500,
            color: theme.ink,
          }}
        >
          Trackr
        </h1>
        <p style={{ margin: "0 0 28px", color: theme.inkSoft, fontSize: 14 }}>
          Sign in to your account to continue.
        </p>

        <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.inkSoft }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@university.edu"
              style={{
                padding: "10px 14px",
                borderRadius: theme.radiusSm,
                border: `1px solid ${theme.border}`,
                fontSize: 15,
                background: theme.bg,
                color: theme.ink,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.inkSoft }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                padding: "10px 14px",
                borderRadius: theme.radiusSm,
                border: `1px solid ${theme.border}`,
                fontSize: 15,
                background: theme.bg,
                color: theme.ink,
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, color: theme.danger, fontSize: 13 }}>{error}</p>
          )}
          {info && (
            <p style={{ margin: 0, color: theme.accent, fontSize: 13 }}>{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "11px 0",
              borderRadius: theme.radiusSm,
              background: theme.accent,
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              border: "none",
            }}
          >
            {loading ? "Please wait…" : "Sign In"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSignUp}
            style={{
              padding: "11px 0",
              borderRadius: theme.radiusSm,
              background: "transparent",
              color: theme.accent,
              fontWeight: 500,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              border: `1px solid ${theme.accentSoft}`,
            }}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
