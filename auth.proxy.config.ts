import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config for `proxy.ts`.
//
// Important: do NOT import database/prisma code here.
// Middleware only needs to be able to read the session/JWT.
export const authProxyConfig: NextAuthConfig = {
	providers: [],
	session: {
		strategy: "jwt",
		// Must match auth.config.ts. A parishioner's device binding lasts six
		// months, and a shorter maxAge here would make the proxy treat a
		// perfectly valid member token as expired and bounce them to login.
		maxAge: 180 * 24 * 60 * 60,
	},
	callbacks: {
		// The default session callback only copies name/email/picture, so a
		// member — who has neither email nor picture — would arrive at the
		// proxy looking like an empty session. Surface the fields the proxy
		// actually reads. No database access; this is pure token mapping.
		session({ session, token }) {
			if (session.user) {
				session.user.id = (token.id as string) ?? "";
				session.user.role = (token.role as string) ?? "";
				session.user.authMethod =
					(token.authMethod as AuthMethod) ?? "password";
			}
			return session;
		},
	},
	pages: {
		signIn: "/auth/login",
		error: "/auth/error",
	},
};
