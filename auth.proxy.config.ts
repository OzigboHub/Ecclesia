import type { NextAuthConfig } from 'next-auth';

// Edge-safe Auth.js config for `proxy.ts`.
//
// Important: do NOT import database/prisma code here.
// Middleware only needs to be able to read the session/JWT.
export const authProxyConfig: NextAuthConfig = {
	providers: [],
	session: {
		strategy: 'jwt',
		maxAge: 24 * 60 * 60,
	},
	pages: {
		signIn: '/auth/login',
		error: '/auth/error',
	},
};
