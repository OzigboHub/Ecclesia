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
	}
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
	}
}
