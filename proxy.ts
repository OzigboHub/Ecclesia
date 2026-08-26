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

// Routes anyone may reach without an account. Listed as exact paths or as
// `prefix/` so that, for example, `/p/` does not also match `/parishioners`.
const publicExact = ["/", "/feed", "/explore", "/start", "/pricing", "/contact"];
const publicPrefixes = [
	"/p/",
	"/donate",
	"/feed/",
	"/explore/",
	"/start/",
	"/gate/",
	"/parish/",
	"/offline",
];

export default auth((req) => {
	// NextAuth middleware injects auth info onto the request as `req.auth`
	const session = (req as any).auth;
	// Check for actual user identity — an empty JWT ({}) still produces
	// a truthy `session.user` object with the default session callback,
	// so we verify a real field exists to avoid redirect loops.
	//
	// Keyed on `id`, not `email`: a parishioner who locked in with a phone
	// number and an access code has no email at all, and keying on email
	// would treat every one of them as signed out.
	const isLoggedIn = !!session?.user?.id;
	const pathname = req.nextUrl.pathname;

	// The one auth route a signed-in-looking visitor must be allowed to reach:
	// it exists precisely to clear a cookie the database has already rejected.
	// Bouncing it to the dashboard would restart the loop it is here to break.
	const isClearingSession = pathname === "/auth/signed-out";
	const isOnAuth = pathname.startsWith("/auth") && !isClearingSession;
	const isProtectedRoute = protectedPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
	const isOnPublic =
		publicExact.includes(pathname) ||
		publicPrefixes.some((prefix) => pathname.startsWith(prefix));

	// Redirect authenticated users away from auth pages, honoring callbackUrl if provided
	if (isLoggedIn && isOnAuth) {
		const rawCallback = req.nextUrl.searchParams.get("callbackUrl");
		if (rawCallback && rawCallback.startsWith("/")) {
			return NextResponse.redirect(new URL(rawCallback, req.url));
		}
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}

	// Redirect unauthenticated users to login (but not on public pages)
	if (!isLoggedIn && isProtectedRoute && !isOnPublic) {
		const loginUrl = new URL("/auth/login", req.url);
		const fullPath = req.nextUrl.pathname + req.nextUrl.search;
		loginUrl.searchParams.set("callbackUrl", fullPath);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
