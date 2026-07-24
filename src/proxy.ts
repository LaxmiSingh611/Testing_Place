import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account") || pathname.startsWith("/checkout");

  if (isAdminRoute) {
    if (!session?.user) {
      const signInUrl = new URL("/sign-in", req.nextUrl.origin);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  if (isAccountRoute && !session?.user) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
