import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authMiddleware = withAuth({
  pages: {
    signIn: "/signin"
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (process.env.REQUIRE_AUTH === "true")
    return authMiddleware(req as unknown as NextRequestWithAuth, event);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico|drinks/).*)"]
};
