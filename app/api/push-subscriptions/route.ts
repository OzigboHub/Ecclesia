import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

function invalidRequest(message: string, status = 400) {
	return NextResponse.json({ success: false, message }, { status });
}

function internalError(message = "Internal server error") {
	return NextResponse.json({ success: false, message }, { status: 500 });
}

async function getSessionContext() {
	const session = await auth();
	if (!session?.user) {
		return { error: invalidRequest("Unauthorized", 401) } as const;
	}

	if (!session.user.id) {
		return {
			error: invalidRequest(
				"Session is missing user id. Please sign in again.",
				401,
			),
		} as const;
	}

	if (!session.user.organizationId) {
		return {
			error: invalidRequest(
				"Session is missing organization context. Please refresh and try again.",
				401,
			),
		} as const;
	}

	return {
		session,
		userId: session.user.id,
		organizationId: session.user.organizationId,
	} as const;
}

export async function POST(request: Request) {
	try {
		const context = await getSessionContext();
		if ("error" in context) {
			return context.error;
		}

		const body = await request
			.json()
			.catch(() => null as Record<string, any> | null);
		if (!body) {
			return invalidRequest("Invalid JSON body");
		}

		const endpoint = body.endpoint as string | undefined;
		const p256dh = body?.keys?.p256dh as string | undefined;
		const authKey = body?.keys?.auth as string | undefined;

		if (!endpoint || !p256dh || !authKey) {
			return invalidRequest("Invalid subscription payload");
		}

		await db.pushSubscription.upsert({
			where: { endpoint },
			update: {
				p256dh,
				auth: authKey,
				userId: context.userId,
				organizationId: context.organizationId,
			},
			create: {
				endpoint,
				p256dh,
				auth: authKey,
				userId: context.userId,
				organizationId: context.organizationId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to upsert push subscription:", error);
		return internalError("Failed to save push subscription");
	}
}

export async function DELETE(request: Request) {
	try {
		const context = await getSessionContext();
		if ("error" in context) {
			return context.error;
		}

		const body = await request.json().catch(() => ({}));
		const endpoint = body?.endpoint as string | undefined;

		if (endpoint) {
			await db.pushSubscription.deleteMany({
				where: {
					endpoint,
					userId: context.userId,
				},
			});
		} else {
			await db.pushSubscription.deleteMany({
				where: {
					userId: context.userId,
				},
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete push subscription:", error);
		return internalError("Failed to remove push subscription");
	}
}
