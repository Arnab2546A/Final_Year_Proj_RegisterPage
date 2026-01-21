import { NextResponse } from "next/server";
import speakeasy from "speakeasy";

// Verify a TOTP code from any authenticator app (Google/Microsoft Authenticator, etc.)
export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const secret = process.env.TOTP_SECRET;
    if (!secret) {
      console.error("Missing env: TOTP_SECRET");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1, // allow slight clock drift
    });

    if (!verified) {
      return NextResponse.json({ ok: false, error: "Invalid or expired code" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("TOTP verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
