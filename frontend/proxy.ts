import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get tokens and user from cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const userCookie = request.cookies.get("user")?.value;

  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      // Invalid user cookie
    }
  }

  const isAuthenticated = !!accessToken && !!user;
  const role = user?.role;

  // Public routes that don't need authentication
  // const isPublicRoute = pathname === "/login" || pathname === "/";

  // Admin routes
  const isAdminRoute = pathname.startsWith("/dashboard") || 
                       pathname.startsWith("/employees") ||
                       pathname.startsWith("/dealers") ||
                       pathname.startsWith("/products");

  // Employee routes
  const isEmployeeRoute = pathname.startsWith("/orders") || 
                         pathname.startsWith("/profile");

  // Protected routes (both admin and employee)
  const isProtectedRoute = isAdminRoute || isEmployeeRoute;

  // Handle unauthenticated users
  if (!isAuthenticated && isProtectedRoute) {
    // Redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle authenticated users trying to access login
  if (isAuthenticated && pathname === "/login") {
    // Redirect to role-specific home
    const homeUrl = role === "admin" ? "/dashboard" : "/orders";
    return NextResponse.redirect(new URL(homeUrl, request.url));
  }

  // Handle employees trying to access admin routes
  if (isAuthenticated && role === "employee" && isAdminRoute) {
    // Redirect to employee home
    return NextResponse.redirect(new URL("/orders", request.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
