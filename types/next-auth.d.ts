import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			role: string;
			displayPicture?: string;
			organizationId: string;
			organizationName: string | null;
			parishionerId: string | null;
			sessionId: string;
			/**
			 * How this session was established. "password" is a staff login
			 * through the console; "parish-code" is a parishioner who bound
			 * this device with a phone number and a one-time code. The two
			 * have different session lifetimes and concurrency rules — see
			 * auth.config.ts.
			 */
			authMethod: AuthMethod;
		} & DefaultSession["user"];
	}

	interface User extends DefaultUser {
		role: string;
		displayPicture?: string;
		organizationId: string;
		organizationName: string | null;
		parishionerId: string | null;
		sessionVersion: number;
		sessionId: string;
		authMethod: AuthMethod;
	}
}

declare global {
	type AuthMethod = "password" | "parish-code";
}

declare module "next-auth/jwt" {
	interface JWT extends DefaultJWT {
		id?: string;
		role?: string;
		displayPicture?: string;
		organizationId?: string;
		organizationName?: string | null;
		parishionerId?: string | null;
		sessionVersion?: number;
		sessionId?: string;
		authMethod?: AuthMethod;
	}
}
