"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../register.css";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usbDetected, setUsbDetected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUsb = async () => {
      try {
        const res = await fetch("/api/check-usb");
        const data = await res.json();
        setUsbDetected(data.detected);
      } catch (e) {
        console.error(e);
        setUsbDetected(false);
      }
    };

    const interval = setInterval(checkUsb, 2000);
    checkUsb();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem("mfa_verified");
    const cookie = document.cookie.split("; ").find((row) => row.startsWith("mfa_verified="));

    if (!authToken && !cookie) {
      router.push("/");
    }
  }, [router]);

  const validateUsername = (value: string): string => {
    if (value.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Username can only contain letters, numbers, underscore, and hyphen";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (value.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(value)) return "Password must contain at least one number";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields
    if (!username.trim() || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      setSuccess("Registration successful! Redirecting...");
      
      // Clear auth state
      localStorage.removeItem("mfa_verified");
      // Mark intent for success page so reload there will redirect back to auth
      sessionStorage.setItem("success_entry", "1");

      router.push("/success");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="register-card" onSubmit={handleSubmit}>
        <div className="card-header">
          <h1>Create Account</h1>
          <p className="subtitle">Join us today</p>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            aria-label="Username"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-label="Password"
          />
          <span className="hint">Min 6 chars, 1 uppercase, 1 number</span>
        </div>

        <div className="input-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            aria-label="Confirm Password"
          />
        </div>

        <div className="usb-status" style={{
          padding: "10px",
          marginBottom: "15px",
          borderRadius: "5px",
          textAlign: "center",
          fontWeight: "bold",
          backgroundColor: usbDetected ? "#e6ffed" : "#fff1f0",
          color: usbDetected ? "#28a745" : "#d73a49",
          border: `1px solid ${usbDetected ? "#28a745" : "#d73a49"}`
        }}>
          {usbDetected === null 
            ? "Checking for USB Drive..." 
            : usbDetected 
              ? "✅ USB Drive Detected" 
              : "❌ Please insert a USB Drive to Register"}
        </div>

        <button type="submit" disabled={isLoading || usbDetected === false} className="submit-button">
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
