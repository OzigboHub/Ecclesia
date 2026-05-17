"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features.server";
import {
	canManageSocieties,
	canReviewSocietyJoinRequests,
} from "@/lib/permissions";
import {
	addMemberSchema,
	createMeetingSchema,
	createSocietySchema,
	updateSocietySchema,
} from "@/lib/validators/society.schema";
import type { ActionResponse } from "@/types";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const SOCIETY_FINANCIAL_ROLES = [
	"SUPER_ADMIN",
	"PARISH_ADMIN",
	"PARISH_SECRETARY",
];

function canAccessSocietyFinancials(role: string, isSocietyLeader: boolean) {
	return isSocietyLeader || SOCIETY_FINANCIAL_ROLES.includes(role);
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SocietyWithRelations = Prisma.SocietyGetPayload<{
	include: {
		president: {
			select: {
				id: true;
				firstName: true;
				lastName: true;
			};
		};
		secretary: {
			select: {
				id: true;
				firstName: true;
				lastName: true;
			};
		};
		_count: {
			select: { members: true };
		};
	};
}>;

export type SocietyWithDetails = Prisma.SocietyGetPayload<{
	include: {
		president: true;
		secretary: true;
		members: {
			include: {
				parishioner: true;
			};
		};
		events: true;
	};
}>;

// ============================================
// READ OPERATIONS
// ============================================

export async function getSocieties(): Promise<
	ActionResponse<SocietyWithRelations[]>
> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableSocieties",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Societies feature is not enabled",
			};
		}

		const societies = await db.society.findMany({
			where: { organizationId: session.user.organizationId },
			include: {
				president: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				secretary: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				_count: {
					select: { members: true },
				},
			},
			orderBy: { name: "asc" },
		});

		return {
			success: true,
			message: "Societies retrieved successfully",
			data: societies,
		};
	} catch (error) {
		console.error("Failed to get societies:", error);
		return { success: false, message: "Failed to retrieve societies" };
	}
}

export async function getSociety(
	id: string,
): Promise<ActionResponse<SocietyWithDetails>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableSocieties",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Societies feature is not enabled",
			};
		}

		// Verify organization ownership with findFirst
		const society = await db.society.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId, // Organization scoping!
			},
			include: {
				president: true,
				secretary: true,
				members: {
					include: {
						parishioner: true,
					},
				},
				events: {
					orderBy: { startTime: "asc" },
				},
			},
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		return {
			success: true,
			message: "Society retrieved successfully",
			data: society,
		};
	} catch (error) {
		console.error("Failed to get society:", error);
		return { success: false, message: "Failed to retrieve society" };
	}
}

export type SocietyMemberDues = {
	societyId: string;
	societyName: string;
	monthlyDueAmount: number | null;
	year: number;
	monthsPaid: number[];
	monthsOwing: number[];
	totalPaid: number;
	totalOwing: number;
	nextDueMonth: number | null;
};

export async function getSocietyDuesForMember(
	societyId: string,
	year?: number,
): Promise<ActionResponse<SocietyMemberDues>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!session.user.parishionerId) {
			return {
				success: false,
				message: "Parishioner context required",
			};
		}

		const targetYear = year || new Date().getFullYear();
		const startOfYear = new Date(targetYear, 0, 1);
		const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: {
				id: true,
				name: true,
				monthlyDueAmount: true,
				members: {
					where: { parishionerId: session.user.parishionerId },
					select: { parishionerId: true },
				},
			},
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		if (!society.members.length) {
			return {
				success: false,
				message: "You are not a member of this society",
			};
		}

		const payments = await db.payment.findMany({
			where: {
				societyId,
				purpose: "SOCIETY_DUES",
				paymentStatus: "COMPLETED",
				paymentDate: { gte: startOfYear, lte: endOfYear },
				parishionerId: session.user.parishionerId,
			},
			select: {
				month: true,
				amount: true,
			},
		});

		const paidMap = new Map<number, number>();
		for (const payment of payments) {
			if (payment.month) {
				paidMap.set(
					payment.month,
					(paidMap.get(payment.month) || 0) + payment.amount,
				);
			}
		}

		const currentMonth =
			targetYear === new Date().getFullYear()
				? new Date().getMonth() + 1
				: 12;
		const dueAmount = society.monthlyDueAmount || 0;
		const monthsPaid: number[] = [];
		const monthsOwing: number[] = [];
		let totalPaid = 0;

		for (let month = 1; month <= currentMonth; month++) {
			const paidAmount = paidMap.get(month) || 0;
			if (paidAmount > 0) {
				monthsPaid.push(month);
				totalPaid += paidAmount;
			} else {
				monthsOwing.push(month);
			}
		}

		const totalOwing = dueAmount * monthsOwing.length;
		const nextDueMonth = monthsOwing.length > 0 ? monthsOwing[0] : null;

		return {
			success: true,
			message: "Society dues retrieved",
			data: {
				societyId,
				societyName: society.name,
				monthlyDueAmount: society.monthlyDueAmount,
				year: targetYear,
				monthsPaid,
				monthsOwing,
				totalPaid,
				totalOwing,
				nextDueMonth,
			},
		};
	} catch (error) {
		console.error("Failed to get society dues for member:", error);
		return { success: false, message: "Failed to retrieve society dues" };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createSociety(
	formData: unknown,
): Promise<ActionResponse<SocietyWithRelations>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageSocieties(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableSocieties",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Societies feature is not enabled",
			};
		}

		// Validation
		const parsed = createSocietySchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const { presidentId, secretaryId, ...rest } = parsed.data;

		// Validate role restrictions and leadership uniqueness before create.
		if (presidentId || secretaryId) {
			const leaderIds = [presidentId, secretaryId].filter(
				Boolean,
			) as string[];
			const [leaders, conflicts] = await Promise.all([
				db.user.findMany({
					where: { id: { in: leaderIds } },
					select: { id: true, role: true },
				}),
				db.society.findMany({
					where: {
						OR: [
							...(presidentId ?
								[{ presidentId }, { secretaryId: presidentId }]
							:	[]),
							...(secretaryId ?
								[{ secretaryId }, { presidentId: secretaryId }]
							:	[]),
						],
					},
					select: {
						id: true,
						name: true,
						presidentId: true,
						secretaryId: true,
					},
				}),
			]);

			const fieldErrors: Record<string, string[]> = {};

			if (presidentId) {
				const leader = leaders.find((l) => l.id === presidentId);
				if (leader?.role === "PARISH_ADMIN") {
					fieldErrors.presidentId = [
						"Parish admins cannot be assigned as society leaders",
					];
				} else {
					const asPresident = conflicts.find(
						(c) => c.presidentId === presidentId,
					);
					const asSecretary = conflicts.find(
						(c) => c.secretaryId === presidentId,
					);
					if (asPresident)
						fieldErrors.presidentId = [
							`This person is already president of: ${asPresident.name}`,
						];
					else if (asSecretary)
						fieldErrors.presidentId = [
							`This person is already secretary of: ${asSecretary.name}`,
						];
				}
			}

			if (secretaryId) {
				const leader = leaders.find((l) => l.id === secretaryId);
				if (leader?.role === "PARISH_ADMIN") {
					fieldErrors.secretaryId = [
						"Parish admins cannot be assigned as society leaders",
					];
				} else {
					const asSecretary = conflicts.find(
						(c) => c.secretaryId === secretaryId,
					);
					const asPresident = conflicts.find(
						(c) => c.presidentId === secretaryId,
					);
					if (asSecretary)
						fieldErrors.secretaryId = [
							`This person is already secretary of: ${asSecretary.name}`,
						];
					else if (asPresident)
						fieldErrors.secretaryId = [
							`This person is already president of: ${asPresident.name}`,
						];
				}
			}

			if (Object.keys(fieldErrors).length > 0) {
				return {
					success: false,
					message:
						"Selected leadership assignment conflicts with an existing society",
					errors: fieldErrors,
				};
			}
		}
		const data = {
			...rest,
			organizationId: session.user.organizationId,
			...(presidentId && { presidentId }),
			...(secretaryId && { secretaryId }),
		};

		const society = await db.society.create({
			data,
			include: {
				president: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				secretary: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				_count: {
					select: { members: true },
				},
			},
		});

		revalidatePath("/dashboard/societies");
		revalidatePath("/societies");

		return {
			success: true,
			message: "Society created successfully",
			data: society,
		};
	} catch (error) {
		console.error("Failed to create society:", error);
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return {
				success: false,
				message:
					"Selected president/secretary is already assigned to another society",
			};
		}
		return { success: false, message: "Failed to create society" };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateSociety(
	id: string,
	formData: unknown,
): Promise<ActionResponse<SocietyWithRelations>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageSocieties(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		// Validation
		const parsed = updateSocietySchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify ownership
		const existing = await db.society.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: "Society not found" };
		}

		const { presidentId, secretaryId } = parsed.data;

		if (presidentId || secretaryId) {
			const leaderIds = [presidentId, secretaryId].filter(
				Boolean,
			) as string[];
			const [leaders, conflicts] = await Promise.all([
				db.user.findMany({
					where: { id: { in: leaderIds } },
					select: { id: true, role: true },
				}),
				db.society.findMany({
					where: {
						id: { not: id },
						OR: [
							...(presidentId ?
								[{ presidentId }, { secretaryId: presidentId }]
							:	[]),
							...(secretaryId ?
								[{ secretaryId }, { presidentId: secretaryId }]
							:	[]),
						],
					},
					select: {
						id: true,
						name: true,
						presidentId: true,
						secretaryId: true,
					},
				}),
			]);

			const fieldErrors: Record<string, string[]> = {};

			if (presidentId) {
				const leader = leaders.find((l) => l.id === presidentId);
				if (leader?.role === "PARISH_ADMIN") {
					fieldErrors.presidentId = [
						"Parish admins cannot be assigned as society leaders",
					];
				} else {
					const asPresident = conflicts.find(
						(c) => c.presidentId === presidentId,
					);
					const asSecretary = conflicts.find(
						(c) => c.secretaryId === presidentId,
					);
					if (asPresident)
						fieldErrors.presidentId = [
							`This person is already president of: ${asPresident.name}`,
						];
					else if (asSecretary)
						fieldErrors.presidentId = [
							`This person is already secretary of: ${asSecretary.name}`,
						];
				}
			}

			if (secretaryId) {
				const leader = leaders.find((l) => l.id === secretaryId);
				if (leader?.role === "PARISH_ADMIN") {
					fieldErrors.secretaryId = [
						"Parish admins cannot be assigned as society leaders",
					];
				} else {
					const asSecretary = conflicts.find(
						(c) => c.secretaryId === secretaryId,
					);
					const asPresident = conflicts.find(
						(c) => c.presidentId === secretaryId,
					);
					if (asSecretary)
						fieldErrors.secretaryId = [
							`This person is already secretary of: ${asSecretary.name}`,
						];
					else if (asPresident)
						fieldErrors.secretaryId = [
							`This person is already president of: ${asPresident.name}`,
						];
				}
			}

			if (Object.keys(fieldErrors).length > 0) {
				return {
					success: false,
					message:
						"Selected leadership assignment conflicts with an existing society",
					errors: fieldErrors,
				};
			}
		}

		const society = await db.society.update({
			where: { id },
			data: parsed.data,
			include: {
				president: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				secretary: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				_count: {
					select: { members: true },
				},
			},
		});

		revalidatePath(`/dashboard/societies/${id}`);
		revalidatePath("/dashboard/societies");

		return {
			success: true,
			message: "Society updated successfully",
			data: society,
		};
	} catch (error) {
		console.error("Failed to update society:", error);
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return {
				success: false,
				message:
					"Selected president/secretary is already assigned to another society",
			};
		}
		return { success: false, message: "Failed to update society" };
	}
}

// ============================================
// MEMBER OPERATIONS
// ============================================

export async function addMember(
	societyId: string,
	formData: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		// Validation
		const parsed = addMemberSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify organization ownership
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		// Check if member already exists
		const existingMember = await db.societyMembership.findUnique({
			where: {
				parishionerId_societyId: {
					parishionerId: parsed.data.parishionerId,
					societyId,
				},
			},
		});

		if (existingMember) {
			return {
				success: false,
				message: "Parishioner is already a member of this society",
			};
		}

		await db.societyMembership.create({
			data: {
				societyId,
				parishionerId: parsed.data.parishionerId,
				role: parsed.data.role,
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}`);

		return {
			success: true,
			message: "Member added successfully",
		};
	} catch (error) {
		console.error("Failed to add member:", error);
		return { success: false, message: "Failed to add member" };
	}
}

export async function removeMember(
	societyId: string,
	parishionerId: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		// Verify organization ownership
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		await db.societyMembership.delete({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}`);

		return {
			success: true,
			message: "Member removed successfully",
		};
	} catch (error) {
		console.error("Failed to remove member:", error);
		return { success: false, message: "Failed to remove member" };
	}
}

// ============================================
// EVENT/MEETING OPERATIONS
// ============================================

export async function createMeeting(
	societyId: string,
	formData: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		// Validation
		const parsed = createMeetingSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify organization ownership
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		await db.event.create({
			data: {
				title: parsed.data.title,
				startTime: parsed.data.startTime,
				endTime: parsed.data.endTime,
				description: parsed.data.description,
				location: parsed.data.location,
				organizationId: session.user.organizationId,
				societyId,
				type: "MEETING",
				status: "SCHEDULED",
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}`);

		return {
			success: true,
			message: "Meeting scheduled successfully",
		};
	} catch (error) {
		console.error("Failed to create meeting:", error);
		return { success: false, message: "Failed to schedule meeting" };
	}
}

export async function markAttendance(
	eventId: string,
	parishionerId: string,
	status: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		// Verify event belongs to user's organization
		const event = await db.event.findFirst({
			where: {
				id: eventId,
				organizationId: session.user.organizationId,
			},
		});

		if (!event) {
			return { success: false, message: "Event not found" };
		}

		await db.eventAttendance.upsert({
			where: {
				eventId_parishionerId: {
					eventId,
					parishionerId,
				},
			},
			create: {
				eventId,
				parishionerId,
				status,
			},
			update: {
				status,
			},
		});

		return {
			success: true,
			message: "Attendance marked successfully",
		};
	} catch (error) {
		console.error("Failed to mark attendance:", error);
		return { success: false, message: "Failed to mark attendance" };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function deleteSociety(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: "Unauthorized" };
		}

		// Only admins can delete
		if (!["SUPER_ADMIN", "PARISH_ADMIN"].includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		// Verify ownership
		const existing = await db.society.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: "Society not found" };
		}

		// Delete memberships first (cascade might handle this)
		await db.societyMembership.deleteMany({
			where: { societyId: id },
		});

		await db.society.delete({ where: { id } });

		revalidatePath("/dashboard/societies");

		return {
			success: true,
			message: "Society deleted successfully",
		};
	} catch (error) {
		console.error("Failed to delete society:", error);
		return { success: false, message: "Failed to delete society" };
	}
}

// ============================================
// JOIN REQUEST OPERATIONS
// ============================================

export type JoinRequestWithParishioner = Prisma.SocietyJoinRequestGetPayload<{
	include: {
		parishioner: {
			select: {
				id: true;
				firstName: true;
				lastName: true;
				phone: true;
				email: true;
			};
		};
	};
}>;

export async function requestToJoinSociety(
	societyId: string,
	message?: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Resolve parishionerId with email fallback + auto-create
		let parishionerId = session.user.parishionerId;

		if (!parishionerId && session.user.email) {
			const parishioner = await db.parishioner.findUnique({
				where: { email: session.user.email },
				select: { id: true },
			});
			parishionerId = parishioner?.id ?? null;
		}

		if (!parishionerId && session.user.email) {
			const user = await db.user.findUnique({
				where: { email: session.user.email },
				select: {
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
					address: true,
					dateOfBirth: true,
					organizationId: true,
				},
			});
			if (user) {
				const newParishioner = await db.parishioner.create({
					data: {
						firstName: user.firstName,
						lastName: user.lastName,
						email: user.email,
						phone: user.phone,
						address: user.address,
						dateOfBirth: user.dateOfBirth,
						organizationId: user.organizationId,
					},
				});
				parishionerId = newParishioner.id;
			}
		}

		if (!parishionerId) {
			return {
				success: false,
				message: "Only parishioners can request to join a society",
			};
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableSocieties",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Societies feature is not enabled",
			};
		}

		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});
		if (!society) {
			return { success: false, message: "Society not found" };
		}

		// Check if already a member
		const alreadyMember = await db.societyMembership.findUnique({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
		});
		if (alreadyMember) {
			return {
				success: false,
				message: "You are already a member of this society",
			};
		}

		// Upsert: if previously rejected, allow re-request; prevent duplicate pending
		const existingRequest = await db.societyJoinRequest.findUnique({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
		});

		if (existingRequest?.status === "PENDING") {
			return {
				success: false,
				message:
					"You already have a pending join request for this society",
			};
		}

		await db.societyJoinRequest.upsert({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
			create: {
				parishionerId,
				societyId,
				status: "PENDING",
				message: message || null,
			},
			update: {
				status: "PENDING",
				message: message || null,
				reviewedById: null,
				reviewedAt: null,
			},
		});

		revalidatePath("/dashboard/societies");
		revalidatePath(`/dashboard/societies/${societyId}`);
		revalidatePath("/societies");
		revalidatePath(`/societies/${societyId}`);

		return {
			success: true,
			message: "Join request submitted successfully",
		};
	} catch (error) {
		console.error("Failed to submit join request:", error);
		return { success: false, message: "Failed to submit join request" };
	}
}

export async function cancelJoinRequest(
	societyId: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Resolve parishionerId with email fallback
		let parishionerId = session.user.parishionerId;
		if (!parishionerId && session.user.email) {
			const parishioner = await db.parishioner.findUnique({
				where: { email: session.user.email },
				select: { id: true },
			});
			parishionerId = parishioner?.id ?? null;
		}

		if (!parishionerId) {
			return { success: false, message: "Unauthorized" };
		}

		const request = await db.societyJoinRequest.findUnique({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
		});

		if (!request || request.status !== "PENDING") {
			return { success: false, message: "No pending join request found" };
		}

		await db.societyJoinRequest.delete({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
		});

		revalidatePath("/dashboard/societies");
		revalidatePath(`/dashboard/societies/${societyId}`);
		revalidatePath("/societies");
		revalidatePath(`/societies/${societyId}`);

		return { success: true, message: "Join request cancelled" };
	} catch (error) {
		console.error("Failed to cancel join request:", error);
		return { success: false, message: "Failed to cancel join request" };
	}
}

export async function getJoinRequestsForSociety(
	societyId: string,
): Promise<ActionResponse<JoinRequestWithParishioner[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const canReview = canReviewSocietyJoinRequests(session.user.role);

		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: { presidentId: true, secretaryId: true },
		});
		if (!society) {
			return { success: false, message: "Society not found" };
		}

		const isSocietyLeader =
			society.presidentId === session.user.id ||
			society.secretaryId === session.user.id;

		if (!canReview && !isSocietyLeader) {
			return { success: false, message: "Permission denied" };
		}

		const requests = await db.societyJoinRequest.findMany({
			where: { societyId, status: "PENDING" },
			include: {
				parishioner: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						phone: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});

		return {
			success: true,
			message: "Join requests retrieved",
			data: requests,
		};
	} catch (error) {
		console.error("Failed to get join requests:", error);
		return { success: false, message: "Failed to retrieve join requests" };
	}
}

export async function approveJoinRequest(
	requestId: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const canReview = canReviewSocietyJoinRequests(session.user.role);

		const request = await db.societyJoinRequest.findFirst({
			where: {
				id: requestId,
				status: "PENDING",
				society: { organizationId: session.user.organizationId },
			},
			include: {
				society: { select: { presidentId: true, secretaryId: true } },
			},
		});

		if (!request) {
			return { success: false, message: "Join request not found" };
		}

		const isSocietyLeader =
			request.society.presidentId === session.user.id ||
			request.society.secretaryId === session.user.id;

		if (!canReview && !isSocietyLeader) {
			return { success: false, message: "Permission denied" };
		}

		// Check if already a member (edge case)
		const alreadyMember = await db.societyMembership.findUnique({
			where: {
				parishionerId_societyId: {
					parishionerId: request.parishionerId,
					societyId: request.societyId,
				},
			},
		});

		await db.$transaction([
			db.societyJoinRequest.update({
				where: { id: requestId },
				data: {
					status: "APPROVED",
					reviewedById: session.user.id,
					reviewedAt: new Date(),
				},
			}),
			...(alreadyMember ?
				[]
			:	[
					db.societyMembership.create({
						data: {
							parishionerId: request.parishionerId,
							societyId: request.societyId,
							role: "MEMBER",
						},
					}),
				]),
		]);

		revalidatePath(`/dashboard/societies/${request.societyId}`);
		revalidatePath("/dashboard/societies");
		revalidatePath(`/societies/${request.societyId}`);
		revalidatePath("/societies");

		return {
			success: true,
			message: "Join request approved and member added",
		};
	} catch (error) {
		console.error("Failed to approve join request:", error);
		return { success: false, message: "Failed to approve join request" };
	}
}

export async function rejectJoinRequest(
	requestId: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const canReview = canReviewSocietyJoinRequests(session.user.role);

		const request = await db.societyJoinRequest.findFirst({
			where: {
				id: requestId,
				status: "PENDING",
				society: { organizationId: session.user.organizationId },
			},
			include: {
				society: { select: { presidentId: true, secretaryId: true } },
			},
		});

		if (!request) {
			return { success: false, message: "Join request not found" };
		}

		const isSocietyLeader =
			request.society.presidentId === session.user.id ||
			request.society.secretaryId === session.user.id;

		if (!canReview && !isSocietyLeader) {
			return { success: false, message: "Permission denied" };
		}

		await db.societyJoinRequest.update({
			where: { id: requestId },
			data: {
				status: "REJECTED",
				reviewedById: session.user.id,
				reviewedAt: new Date(),
			},
		});

		revalidatePath(`/dashboard/societies/${request.societyId}`);
		revalidatePath("/dashboard/societies");
		revalidatePath(`/societies/${request.societyId}`);
		revalidatePath("/societies");

		return { success: true, message: "Join request rejected" };
	} catch (error) {
		console.error("Failed to reject join request:", error);
		return { success: false, message: "Failed to reject join request" };
	}
}

// ============================================
// SOCIETY HEAD MANAGEMENT
// ============================================

export type SocietyHeadInfo = Prisma.SocietyGetPayload<{
	include: {
		president: {
			select: { id: true; firstName: true; lastName: true };
		};
		secretary: {
			select: { id: true; firstName: true; lastName: true };
		};
		_count: {
			select: { members: true; payments: true };
		};
	};
}>;

/**
 * Get the society that the current user leads (as president or secretary)
 */
export async function getSocietyForCurrentUser(): Promise<
	ActionResponse<SocietyHeadInfo>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableSocieties",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Societies feature is not enabled",
			};
		}

		const society = await db.society.findFirst({
			where: {
				organizationId: session.user.organizationId,
				OR: [
					{ presidentId: session.user.id },
					{ secretaryId: session.user.id },
				],
			},
			include: {
				president: {
					select: { id: true, firstName: true, lastName: true },
				},
				secretary: {
					select: { id: true, firstName: true, lastName: true },
				},
				_count: {
					select: { members: true, payments: true },
				},
			},
		});

		if (!society) {
			return {
				success: false,
				message: "You are not a leader of any society",
			};
		}

		return {
			success: true,
			message: "Society retrieved successfully",
			data: society,
		};
	} catch (error) {
		console.error("Failed to get society for user:", error);
		return { success: false, message: "Failed to retrieve society" };
	}
}

export type MemberDuesStatus = {
	parishionerId: string;
	firstName: string;
	lastName: string;
	phone: string | null;
	email: string | null;
	joinedAt: Date;
	role: string;
	monthsPaid: number[];
	monthsOwing: number[];
	totalPaid: number;
	totalOwing: number;
};

/**
 * Get dues overview for all members showing paid/owing months for a given year
 */
export async function getSocietyDuesOverview(
	societyId: string,
	year?: number,
): Promise<
	ActionResponse<{
		members: MemberDuesStatus[];
		monthlyDueAmount: number | null;
		year: number;
	}>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const targetYear = year || new Date().getFullYear();
		const startOfYear = new Date(targetYear, 0, 1);
		const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

		const societyData = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: {
				id: true,
				presidentId: true,
				secretaryId: true,
				monthlyDueAmount: true,
				members: {
					include: {
						parishioner: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								phone: true,
								email: true,
							},
						},
					},
				},
			},
		});

		if (!societyData) {
			return { success: false, message: "Society not found" };
		}

		const isSocietyLeader =
			societyData.presidentId === session.user.id ||
			societyData.secretaryId === session.user.id;

		if (!canAccessSocietyFinancials(session.user.role, isSocietyLeader)) {
			return { success: false, message: "Permission denied" };
		}

		// Get all SOCIETY_DUES payments for this society in the year
		const payments = await db.payment.findMany({
			where: {
				societyId,
				purpose: "SOCIETY_DUES",
				paymentStatus: "COMPLETED",
				paymentDate: { gte: startOfYear, lte: endOfYear },
			},
			select: {
				parishionerId: true,
				month: true,
				amount: true,
			},
		});

		// Build lookup: parishionerId -> Set of paid months
		const paidMap = new Map<string, Map<number, number>>();
		for (const p of payments) {
			if (p.parishionerId && p.month) {
				const existing =
					paidMap.get(p.parishionerId) || new Map<number, number>();
				existing.set(p.month, (existing.get(p.month) || 0) + p.amount);
				paidMap.set(p.parishionerId, existing);
			}
		}

		const currentMonth =
			targetYear === new Date().getFullYear() ?
				new Date().getMonth() + 1
			:	12;
		const dueAmount = societyData.monthlyDueAmount || 0;

		const members: MemberDuesStatus[] = societyData.members.map((m) => {
			const parishioner = m.parishioner;
			const memberPayments = paidMap.get(parishioner.id) || new Map();
			const monthsPaid: number[] = [];
			const monthsOwing: number[] = [];
			let totalPaid = 0;

			for (let month = 1; month <= currentMonth; month++) {
				const paidAmount = memberPayments.get(month) || 0;
				if (paidAmount > 0) {
					monthsPaid.push(month);
					totalPaid += paidAmount;
				} else {
					monthsOwing.push(month);
				}
			}

			const totalOwing =
				dueAmount > 0 ? monthsOwing.length * dueAmount : 0;

			return {
				parishionerId: parishioner.id,
				firstName: parishioner.firstName,
				lastName: parishioner.lastName,
				phone: parishioner.phone,
				email: parishioner.email,
				joinedAt: m.joinedAt,
				role: m.role,
				monthsPaid,
				monthsOwing,
				totalPaid,
				totalOwing,
			};
		});

		return {
			success: true,
			message: "Dues overview retrieved",
			data: {
				members,
				monthlyDueAmount: societyData.monthlyDueAmount,
				year: targetYear,
			},
		};
	} catch (error) {
		console.error("Failed to get dues overview:", error);
		return { success: false, message: "Failed to retrieve dues overview" };
	}
}

export type SocietyPaymentRecord = Prisma.PaymentGetPayload<{
	include: {
		parishioner: {
			select: {
				id: true;
				firstName: true;
				lastName: true;
			};
		};
		recordedBy: {
			select: {
				id: true;
				firstName: true;
				lastName: true;
			};
		};
	};
}>;

/**
 * Get all payment records for a society
 */
export async function getSocietyPayments(
	societyId: string,
	query?: { page?: number; limit?: number; year?: number; month?: number },
): Promise<
	ActionResponse<{ payments: SocietyPaymentRecord[]; total: number }>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Verify user has access (is society leader or admin)
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: { presidentId: true, secretaryId: true },
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		const isSocietyLeader =
			society.presidentId === session.user.id ||
			society.secretaryId === session.user.id;

		if (!canAccessSocietyFinancials(session.user.role, isSocietyLeader)) {
			return { success: false, message: "Permission denied" };
		}

		const page = query?.page || 1;
		const limit = Math.min(query?.limit || 20, 100);

		const where: Prisma.PaymentWhereInput = {
			societyId,
			purpose: "SOCIETY_DUES",
			organizationId: session.user.organizationId,
			...(query?.month && { month: query.month }),
			...(query?.year && {
				paymentDate: {
					gte: new Date(query.year, 0, 1),
					lte: new Date(query.year, 11, 31, 23, 59, 59),
				},
			}),
		};

		const [payments, total] = await Promise.all([
			db.payment.findMany({
				where,
				include: {
					parishioner: {
						select: { id: true, firstName: true, lastName: true },
					},
					recordedBy: {
						select: { id: true, firstName: true, lastName: true },
					},
				},
				orderBy: { paymentDate: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			db.payment.count({ where }),
		]);

		return {
			success: true,
			message: "Payments retrieved",
			data: { payments, total },
		};
	} catch (error) {
		console.error("Failed to get society payments:", error);
		return { success: false, message: "Failed to retrieve payments" };
	}
}

/**
 * Record a society due payment for a member
 */
export async function recordSocietyDue(
	societyId: string,
	formData: {
		parishionerId: string;
		amount: number;
		month: number;
		year: number;
		paymentMethod: string;
		notes?: string;
	},
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Verify user is society leader or admin
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: {
				id: true,
				presidentId: true,
				secretaryId: true,
				monthlyDueAmount: true,
			},
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		const isSocietyLeader =
			society.presidentId === session.user.id ||
			society.secretaryId === session.user.id;

		if (!canAccessSocietyFinancials(session.user.role, isSocietyLeader)) {
			return { success: false, message: "Permission denied" };
		}

		// Verify member belongs to this society
		const membership = await db.societyMembership.findUnique({
			where: {
				parishionerId_societyId: {
					parishionerId: formData.parishionerId,
					societyId,
				},
			},
			include: {
				parishioner: {
					select: { firstName: true, lastName: true },
				},
			},
		});

		if (!membership) {
			return {
				success: false,
				message: "Parishioner is not a member of this society",
			};
		}

		// Validate amount
		if (formData.amount <= 0) {
			return { success: false, message: "Amount must be greater than 0" };
		}

		// Validate month
		if (formData.month < 1 || formData.month > 12) {
			return { success: false, message: "Invalid month" };
		}

		// Generate receipt number
		const year = new Date().getFullYear();
		const prefix = `RCP-${year}`;
		const lastPayment = await db.payment.findFirst({
			where: {
				organizationId: session.user.organizationId,
				receiptNumber: { startsWith: prefix },
			},
			orderBy: { receiptNumber: "desc" },
			select: { receiptNumber: true },
		});
		let nextNumber = 1;
		if (lastPayment?.receiptNumber) {
			const lastNum = parseInt(
				lastPayment.receiptNumber.split("-").pop() || "0",
			);
			nextNumber = lastNum + 1;
		}
		const receiptNumber = `${prefix}-${nextNumber.toString().padStart(6, "0")}`;

		const paymentDate = new Date(formData.year, formData.month - 1, 15);

		await db.payment.create({
			data: {
				amount: formData.amount,
				currency: "NGN",
				purpose: "SOCIETY_DUES",
				month: formData.month,
				paymentMethod: formData.paymentMethod as any,
				paymentStatus: "COMPLETED",
				parishionerId: formData.parishionerId,
				payerName: `${membership.parishioner.firstName} ${membership.parishioner.lastName}`,
				recordedById: session.user.id,
				receiptNumber,
				paymentDate,
				organizationId: session.user.organizationId,
				societyId,
				notes: formData.notes,
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}/manage`);
		revalidatePath(`/dashboard/societies/${societyId}`);

		return { success: true, message: "Due payment recorded successfully" };
	} catch (error) {
		console.error("Failed to record society due:", error);
		return { success: false, message: "Failed to record payment" };
	}
}

export type SocietyMemberRecord = {
	parishionerId: string;
	firstName: string;
	lastName: string;
	otherNames: string | null;
	email: string | null;
	phone: string | null;
	gender: string | null;
	dateOfBirth: Date | null;
	address: string | null;
	joinedAt: Date;
	role: string;
};

/**
 * Get detailed member records for a society
 */
export async function getSocietyMemberRecords(
	societyId: string,
): Promise<ActionResponse<SocietyMemberRecord[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: { presidentId: true, secretaryId: true },
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		const isSocietyLeader =
			society.presidentId === session.user.id ||
			society.secretaryId === session.user.id;

		if (!canManageSocieties(session.user.role) && !isSocietyLeader) {
			return { success: false, message: "Permission denied" };
		}

		const memberships = await db.societyMembership.findMany({
			where: { societyId },
			include: {
				parishioner: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						otherNames: true,
						email: true,
						phone: true,
						gender: true,
						dateOfBirth: true,
						address: true,
					},
				},
			},
			orderBy: { joinedAt: "asc" },
		});

		const records: SocietyMemberRecord[] = memberships.map((m) => ({
			parishionerId: m.parishioner.id,
			firstName: m.parishioner.firstName,
			lastName: m.parishioner.lastName,
			otherNames: m.parishioner.otherNames,
			email: m.parishioner.email,
			phone: m.parishioner.phone,
			gender: m.parishioner.gender,
			dateOfBirth: m.parishioner.dateOfBirth,
			address: m.parishioner.address,
			joinedAt: m.joinedAt,
			role: m.role,
		}));

		return {
			success: true,
			message: "Member records retrieved",
			data: records,
		};
	} catch (error) {
		console.error("Failed to get member records:", error);
		return { success: false, message: "Failed to retrieve member records" };
	}
}

/**
 * Update the monthly due amount for a society
 */
export async function updateSocietyDueAmount(
	societyId: string,
	amount: number,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: { presidentId: true, secretaryId: true },
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		const isSocietyLeader =
			society.presidentId === session.user.id ||
			society.secretaryId === session.user.id;

		if (!canManageSocieties(session.user.role) && !isSocietyLeader) {
			return { success: false, message: "Permission denied" };
		}

		if (amount < 0) {
			return { success: false, message: "Amount cannot be negative" };
		}

		await db.society.update({
			where: { id: societyId },
			data: { monthlyDueAmount: amount || null },
		});

		revalidatePath(`/dashboard/societies/${societyId}/manage`);

		return { success: true, message: "Monthly due amount updated" };
	} catch (error) {
		console.error("Failed to update due amount:", error);
		return { success: false, message: "Failed to update due amount" };
	}
}
