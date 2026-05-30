import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/jwt";

const publicPaths = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/verify-otp",
  "/api/auth/register",
  "/api/auth/login-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];
const publicPathPrefixes = ["/api/cron"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public prefixes
  if (publicPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    // Verify cron secret for cron routes
    if (pathname.startsWith("/api/cron")) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // Check authentication — cookie (web) or Authorization Bearer (mobile)
  let token = request.cookies.get("medcare_session")?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|sounds).*)"],
};
