import { signOut } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Clears a session cookie that the database has already invalidated.
 *
 * Server components cannot set cookies, so a layout that discovers its session
 * is dead can only redirect — it cannot clear the cookie that made it look
 * alive. And the proxy runs on the edge with no database access, so it reads
 * that stale cookie, decides the visitor is signed in, and bounces them off
 * /auth/login straight back to the page that just rejected them.
 *
 * The result is a redirect loop that leaves someone apparently signed in to a
 * session that no longer exists — which is what happens when a staff member is
 * signed out by a login elsewhere, or by the idle timeout.
 *
 * A route handler can set cookies. So the layout sends people here instead, the
 * cookie is dropped, and the redirect to the login page finally sticks.
 */
export async function GET(request: Request) {
	await signOut({ redirect: false });

	const reason = new URL(request.url).searchParams.get("reason");
	const target = new URL("/auth/login", request.url);
	if (reason) target.searchParams.set("reason", reason);

	return NextResponse.redirect(target);
}
