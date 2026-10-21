import { NextResponse } from "next/server";

// Runs before every page loads (and on prefetches): is there a session cookie at all?
// No cookie → go to /login, and come back to the same page after signing in.
// This is only a quick check; it never calls the API. The real checks are in
// lib/session.js (which pages to show) and in the API itself (what data to give).
export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const hasSessionCookie = request.cookies.has("pz_session");

  if (!isLoginPage && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Every page, but not the API, Next.js's own files, or images.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
