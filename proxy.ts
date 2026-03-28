import { authProxyConfig } from "@/auth.proxy.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authProxyConfig);

const protectedPrefixes = [
	"/dashboard",
	"/announcements",
	"/appointments",
	"/mass-intentions",
	"/mass-schedule",
	"/masses",
	"/parishioners",
	"/payments",
	"/sessions",
	"/settings",
	"/societies",
	"/users",
];

export default auth((req) => {
	// NextAuth middleware injects auth info onto the request as `req.auth`
	const session = (req as any).auth;
	const isLoggedIn = !!session?.user;
	const pathname = req.nextUrl.pathname;

	const isOnAuth = pathname.startsWith("/auth");
	const isProtectedRoute = protectedPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
	const isOnPublic =
		pathname === "/" ||
		pathname.startsWith("/p") ||
		pathname.startsWith("/donate");

	// Redirect authenticated users away from auth pages
	if (isLoggedIn && isOnAuth) {
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}

	// Redirect unauthenticated users to login (but not on public pages)
	if (!isLoggedIn && isProtectedRoute && !isOnPublic) {
		return NextResponse.redirect(new URL("/auth/login", req.url));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
