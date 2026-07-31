import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kasir-coffee-shop-secret-jwt-key-2026-secure!"
);
const COOKIE_NAME = "kasir_session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip static files, api routes, and icons
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/favicon") ||
    path === "/icon"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let user: { id: number; nama: string; username: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = {
        id: Number(payload.id),
        nama: String(payload.nama),
        username: String(payload.username),
        role: String(payload.role),
      };
    } catch (err) {
      user = null;
    }
  }

  // Login page logic
  if (path === "/login") {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes: redirect to login if no active session
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  // Admin & Super Admin restricted routes
  const adminOnlyRoutes = ["/menu", "/dashboard", "/promo", "/users", "/pengaturan"];
  const isAdminRoute = adminOnlyRoutes.some((route) => path.startsWith(route));

  if (isAdminRoute && user.role !== "admin" && user.role !== "super_admin") {
    // Redirect unauthorized karyawan back to POS page
    return NextResponse.redirect(new URL("/?unauthorized=true", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
