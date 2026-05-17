"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "../register.css";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const cameFromRegister = sessionStorage.getItem("success_entry") === "1";

    // If page was reloaded, redirect to authenticator
    if (nav && nav.type === "reload") {
      sessionStorage.removeItem("success_entry");
      router.replace("/auth");
      return;
    }

    // If accessed without the flag (direct hit), redirect
    if (!cameFromRegister) {
      router.replace("/auth");
      return;
    }
    // Keep the flag so the page remains visible during this session; reload will still redirect
  }, [router]);

  return (
    <div className="container">
      <div className="register-card">
        <div className="card-header">
          <h1>✓ Registration Successful!</h1>
          <p className="subtitle">Your account has been created successfully</p>
        </div>

        <div className="success" style={{ textAlign: "center", padding: "20px" }}>
          <p style={{ fontSize: "18px", marginBottom: "15px" }}>
            Your private key has been sent to the administrator's email.
          </p>
        </div>
      </div>
    </div>
  );
}
