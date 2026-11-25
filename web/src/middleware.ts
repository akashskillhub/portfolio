import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "skillhub_admin_session";

function getSecretKey(): Uint8Array {
  const secret = process.env.SKILLHUB_AUTH_SECRET || "default_fallback_secret_32_characters_long_min!";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/setup") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, getSecretKey());
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. Normalize pathname by stripping trailing slashes for clean route matching
  const normalizedPath = pathname.length > 1 && pathname.endsWith("/") 
    ? pathname.slice(0, -1) 
    : pathname;

  // 2. Admin Login page (/account)
  if (normalizedPath === "/account") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/account/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 3. Protected Admin CMS routes (/account/dashboard, /account/profile, etc.)
  if (normalizedPath.startsWith("/account/")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/account", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/account",
  ],
};
