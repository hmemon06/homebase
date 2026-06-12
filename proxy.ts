import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, sessionToken } from "@/lib/auth";

// Machine endpoints authenticate themselves with SYNC_SECRET.
const OPEN_PATHS = ["/login", "/api/login", "/api/sync/", "/api/standup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await sessionToken())) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
