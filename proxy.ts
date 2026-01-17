import NextAuth from 'next-auth';
import { authProxyConfig } from '@/auth.proxy.config';

const { auth } = NextAuth(authProxyConfig);

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
	const isOnAuth = req.nextUrl.pathname.startsWith('/auth');

	// Redirect authenticated users away from auth pages
	if (isLoggedIn && isOnAuth) {
		return Response.redirect(new URL('/dashboard', req.url));
	}

	// Redirect unauthenticated users to login
	if (!isLoggedIn && isOnDashboard) {
		return Response.redirect(new URL('/auth/login', req.url));
	}
});

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
