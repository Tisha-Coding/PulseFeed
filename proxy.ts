import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Edge middleware — the first line of auth defence. It runs before a
// protected page is rendered, so unauthorised users are redirected without
// the page's code (or data fetching) ever executing. API routes still
// re-verify the role independently, so this stays defence-in-depth rather
// than the only gate.
export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Unauthenticated hitting any protected subtree → send to login.
  if (!token && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Authenticated but not an admin → /admin is off-limits, send home.
  if (path.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Restrict the middleware to the protected subtrees only — public pages
// (feed, content, auth) skip this work entirely.
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
