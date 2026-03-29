"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { isFeatureEnabledForRole } from "@/lib/features.server";
import {
	createLiveStreamSchema,
	updateLiveStreamSchema,
} from "@/lib/validators/live-stream.schema";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

// ============================================
// HELPERS
// ============================================

async function checkLiveStreamingEnabled(organizationId: string, role?: string) {
	return isFeatureEnabledForRole(organizationId, "enableLiveStreaming", role);
}

// ============================================
// READ OPERATIONS
// ============================================

export async function getLiveStreams(): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const enabled = await checkLiveStreamingEnabled(
			session.user.organizationId,
			session.user.role,
		);
		if (!enabled) {
			return {
				success: false,
				message: "Live streaming is not enabled for your organization",
			};
		}

		const streams = await db.liveStream.findMany({
			where: { organizationId: session.user.organizationId },
			include: {
				mass: {
					select: {
						id: true,
						date: true,
						time: true,
						massType: true,
						celebrant: true,
						location: true,
					},
				},
				createdBy: {
					select: { id: true, firstName: true, lastName: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return {
			success: true,
			message: "Live streams retrieved",
			data: streams,
		};
	} catch (error) {
		console.error("Failed to get live streams:", error);
		return { success: false, message: "Failed to retrieve live streams" };
	}
}

export async function getLiveStream(
	id: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const stream = await db.liveStream.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
			include: {
				mass: {
					select: {
						id: true,
						date: true,
						time: true,
						massType: true,
						celebrant: true,
						location: true,
						status: true,
					},
				},
				createdBy: {
					select: { id: true, firstName: true, lastName: true },
				},
				organization: {
					select: { id: true, name: true },
				},
			},
		});

		if (!stream) {
			return { success: false, message: "Live stream not found" };
		}

		return {
			success: true,
			message: "Live stream retrieved",
			data: stream,
		};
	} catch (error) {
		console.error("Failed to get live stream:", error);
		return { success: false, message: "Failed to retrieve live stream" };
	}
}

export async function getCurrentLiveStream(): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const enabled = await checkLiveStreamingEnabled(
			session.user.organizationId,
			session.user.role,
		);
		if (!enabled) {
			return {
				success: false,
				message: "Live streaming is not enabled for your organization",
			};
		}

		const stream = await db.liveStream.findFirst({
			where: {
				organizationId: session.user.organizationId,
				isLive: true,
			},
			include: {
				mass: {
					select: {
						id: true,
						date: true,
						time: true,
						massType: true,
						celebrant: true,
						location: true,
					},
				},
				organization: {
					select: { id: true, name: true },
				},
			},
		});

		return {
			success: true,
			message: stream ? "Live stream found" : "No active live stream",
			data: stream,
		};
	} catch (error) {
		console.error("Failed to get current live stream:", error);
		return {
			success: false,
			message: "Failed to retrieve current live stream",
		};
	}
}

export async function getPastStreams(): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const enabled = await checkLiveStreamingEnabled(
			session.user.organizationId,
			session.user.role,
		);
		if (!enabled) {
			return {
				success: false,
				message: "Live streaming is not enabled for your organization",
			};
		}

		const streams = await db.liveStream.findMany({
			where: {
				organizationId: session.user.organizationId,
				isLive: false,
				endedAt: { not: null },
			},
			include: {
				mass: {
					select: {
						id: true,
						date: true,
						time: true,
						massType: true,
						celebrant: true,
						location: true,
					},
				},
				organization: {
					select: { id: true, name: true },
				},
			},
			orderBy: { endedAt: "desc" },
		});

		return {
			success: true,
			message: "Past streams retrieved",
			data: streams,
		};
	} catch (error) {
		console.error("Failed to get past streams:", error);
		return { success: false, message: "Failed to retrieve past streams" };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createLiveStream(
	formData: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const allowedRoles = [
			"SUPER_ADMIN",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"OUTSTATION_ADMIN",
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const parsed = createLiveStreamSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors as Record<
					string,
					string[]
				>,
			};
		}

		const enabled = await checkLiveStreamingEnabled(
			session.user.organizationId,
			session.user.role,
		);
		if (!enabled) {
			return {
				success: false,
				message: "Live streaming is not enabled for your organization",
			};
		}

		const { massId, ...rest } = parsed.data;

		// If massId provided, verify it belongs to the same org
		if (massId) {
			const mass = await db.mass.findFirst({
				where: {
					id: massId,
					organizationId: session.user.organizationId,
				},
			});
			if (!mass) {
				return { success: false, message: "Mass not found" };
			}

			// Check if mass already has a live stream
			const existingStream = await db.liveStream.findUnique({
				where: { massId },
			});
			if (existingStream) {
				return {
					success: false,
					message: "This mass already has a live stream attached",
				};
			}
		}

		const stream = await db.liveStream.create({
			data: {
				...rest,
				massId: massId || null,
				organizationId: session.user.organizationId,
				createdById: session.user.id,
			},
		});

		revalidatePath("/live-streams");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Live stream created successfully",
			data: stream,
		};
	} catch (error) {
		console.error("Failed to create live stream:", error);
		return { success: false, message: "Failed to create live stream" };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateLiveStream(
	id: string,
	formData: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const allowedRoles = [
			"SUPER_ADMIN",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"OUTSTATION_ADMIN",
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const parsed = updateLiveStreamSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors as Record<
					string,
					string[]
				>,
			};
		}

		const existing = await db.liveStream.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});
		if (!existing) {
			return { success: false, message: "Live stream not found" };
		}

		const { massId, ...rest } = parsed.data;

		// If changing massId, verify it belongs to same org and isn't already attached
		if (massId && massId !== existing.massId) {
			const mass = await db.mass.findFirst({
				where: {
					id: massId,
					organizationId: session.user.organizationId,
				},
			});
			if (!mass) {
				return { success: false, message: "Mass not found" };
			}

			const existingStream = await db.liveStream.findUnique({
				where: { massId },
			});
			if (existingStream && existingStream.id !== id) {
				return {
					success: false,
					message: "This mass already has a live stream attached",
				};
			}
		}

		const stream = await db.liveStream.update({
			where: { id },
			data: {
				...rest,
				...(massId !== undefined
					? { massId: massId || null }
					: {}),
			},
		});

		revalidatePath("/live-streams");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Live stream updated successfully",
			data: stream,
		};
	} catch (error) {
		console.error("Failed to update live stream:", error);
		return { success: false, message: "Failed to update live stream" };
	}
}

// ============================================
// GO LIVE / END STREAM
// ============================================

export async function goLive(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const allowedRoles = [
			"SUPER_ADMIN",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"OUTSTATION_ADMIN",
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const existing = await db.liveStream.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});
		if (!existing) {
			return { success: false, message: "Live stream not found" };
		}

		const stream = await db.liveStream.update({
			where: { id },
			data: {
				isLive: true,
				startedAt: new Date(),
				endedAt: null,
			},
		});

		revalidatePath("/live-streams");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Stream is now live!",
			data: stream,
		};
	} catch (error) {
		console.error("Failed to go live:", error);
		return { success: false, message: "Failed to start live stream" };
	}
}

export async function endStream(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const allowedRoles = [
			"SUPER_ADMIN",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"OUTSTATION_ADMIN",
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const existing = await db.liveStream.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});
		if (!existing) {
			return { success: false, message: "Live stream not found" };
		}

		const stream = await db.liveStream.update({
			where: { id },
			data: {
				isLive: false,
				endedAt: new Date(),
			},
		});

		revalidatePath("/live-streams");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Stream ended successfully",
			data: stream,
		};
	} catch (error) {
		console.error("Failed to end stream:", error);
		return { success: false, message: "Failed to end live stream" };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function deleteLiveStream(
	id: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN"];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const existing = await db.liveStream.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});
		if (!existing) {
			return { success: false, message: "Live stream not found" };
		}

		await db.liveStream.delete({ where: { id } });

		revalidatePath("/live-streams");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Live stream deleted successfully",
		};
	} catch (error) {
		console.error("Failed to delete live stream:", error);
		return { success: false, message: "Failed to delete live stream" };
	}
}

// ============================================
// GET MASSES FOR STREAM LINKING
// ============================================

export async function getMassesForStreamLinking(): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) return { success: false, message: "Unauthorized" };

		// Get upcoming masses that don't already have a stream
		const masses = await db.mass.findMany({
			where: {
				organizationId: session.user.organizationId,
				date: { gte: new Date() },
				liveStream: null,
			},
			select: {
				id: true,
				date: true,
				time: true,
				massType: true,
				celebrant: true,
				location: true,
			},
			orderBy: [{ date: "asc" }, { time: "asc" }],
			take: 50,
		});

		return {
			success: true,
			message: "Masses retrieved",
			data: masses,
		};
	} catch (error) {
		console.error("Failed to get masses for linking:", error);
		return { success: false, message: "Failed to retrieve masses" };
	}
}
