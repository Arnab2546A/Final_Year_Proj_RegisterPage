import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const mfaVerified = request.cookies.get("mfa_verified");

  // If trying to access any protected route without mfa_verified cookie, redirect to /auth
  if (!mfaVerified && request.nextUrl.pathname !== "/auth") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // If already verified and trying to access /auth, redirect to /register
  if (mfaVerified && request.nextUrl.pathname === "/auth") {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
