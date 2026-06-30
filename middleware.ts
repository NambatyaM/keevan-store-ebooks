import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  if (hostname === "www.keevanstore.in") {
    const url = new URL(request.url);
    url.hostname = "keevanstore.in";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/creator/:path*", "/admin/:path*", "/buyer/:path*"]
};
