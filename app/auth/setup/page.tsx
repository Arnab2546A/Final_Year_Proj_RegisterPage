"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import "../../register.css";

type QrResponse = {
  qr: string;
  otpauth: string;
  secret: string;
  issuer: string;
  accountName: string;
};

export default function AuthSetupPage() {
  const [data, setData] = useState<QrResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/qr");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load QR");
        } else {
          setData(json);
        }
      } catch (err) {
        setError("Failed to load QR");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="register-card">
        <div className="card-header">
          <h1>Set Up Authenticator</h1>
          <p className="subtitle">Use the QR code to add your account in Google/Microsoft Authenticator</p>
        </div>

        {loading && <div className="success">Loading QR...</div>}
        {error && <div className="error">{error}</div>}

        {data && (
          <>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <Image
                src={data.qr}
                alt="Authenticator QR"
                width={220}
                height={220}
              />
            </div>
            <div className="input-group">
              <label>Account</label>
              <div className="hint">{data.accountName} (issuer: {data.issuer})</div>
            </div>
            <div className="input-group">
              <label>Manual key (base32)</label>
              <div className="hint" style={{ wordBreak: "break-all" }}>{data.secret}</div>
            </div>
            <div className="input-group">
              <label>OTPAuth URI (optional)</label>
              <div className="hint" style={{ wordBreak: "break-all" }}>{data.otpauth}</div>
            </div>
            <div className="success">Codes refresh every 30 seconds. Use this to verify on /auth.</div>
          </>
        )}
      </div>
    </div>
  );
}
