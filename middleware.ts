import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const mfaVerified = request.cookies.get("mfa_verified");

  // If trying to access /register without mfa_verified cookie, redirect to home
  if (request.nextUrl.pathname === "/register" && !mfaVerified) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/register"],
};
