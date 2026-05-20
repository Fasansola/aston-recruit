import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected path prefixes that require authentication
const PROTECTED_PREFIXES = ["/jobs", "/applications", "/pipeline", "/settings"];

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Check if the route needs protection
  const isProtected =
    pathname === "/" ||
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    const session = await auth();
    const isLoggedIn = !!session?.user;

    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - API auth routes (needed for the login flow)
     * - login page itself
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth|login).*)",
  ],
};
