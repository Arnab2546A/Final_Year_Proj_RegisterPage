"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./register.css";

export default function VerificationPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Clear any existing verification first
    localStorage.removeItem("mfa_verified");
    document.cookie = "mfa_verified=; path=/; max-age=0";

    // Clear verification when browser/tab closes
    const clearAuth = () => {
      localStorage.removeItem("mfa_verified");
      document.cookie = "mfa_verified=; path=/; max-age=0";
    };
    window.addEventListener("beforeunload", clearAuth);
    return () => window.removeEventListener("beforeunload", clearAuth);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Enter the 6-digit code from your authenticator app");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Invalid code. Try again.");
        return;
      }

      // Set cookie and localStorage (session only - expires on browser close)
      localStorage.setItem("mfa_verified", "true");
      document.cookie = "mfa_verified=true; path=/"; // Session cookie
      router.push("/register");
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="register-card" onSubmit={handleSubmit}>
        <div className="card-header">
          <h1>Verify Authentication</h1>
          <p className="subtitle">Enter the 6-digit code from your authenticator app</p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="input-group">
          <label htmlFor="token">Authenticator Code</label>
          <input
            id="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            disabled={isLoading}
            aria-label="Authenticator Code"
          />
          <span className="hint">Codes refresh every 30 seconds.</span>
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? "Verifying..." : "Verify"}
        </button>

        <p className="login-link">
          Need to set up? <a href="/auth/setup">Scan QR</a>
        </p>
      </form>
    </div>
  );
}
