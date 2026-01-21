import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function GET() {
  try {
    const secret = process.env.TOTP_SECRET;
    if (!secret) {
      console.error("Missing env: TOTP_SECRET");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const accountName = process.env.EMAIL_USER || "adcollege123456@gmail.com";
    const issuer = "AdCollege";

    const otpauth = speakeasy.otpauthURL({
      secret,
      label: `${issuer}:${accountName}`,
      issuer,
      encoding: "base32",
    });

    const qr = await QRCode.toDataURL(otpauth);

    return NextResponse.json({
      otpauth,
      qr,
      secret,
      issuer,
      accountName,
    });
  } catch (err) {
    console.error("TOTP QR error:", err);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
