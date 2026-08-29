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

function isSocietyLeaderForSession(
	society: { presidentId: string | null; secretaryId: string | null },
	session: { user: { parishionerId?: string | null } },
) {
	const parishionerId = session.user.parishionerId ?? null;
	if (!parishionerId) return false;
	return (
		society.presidentId === parishionerId ||
		society.secretaryId === parishionerId
	);
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SocietyWithRelations = Prisma.SocietyGetPayload<{
	include: {
		president: {
			select: { id: true; firstName: true; lastName: true };
		};
		secretary: {
			select: { id: true; firstName: true; lastName: true };
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
		events: {
			orderBy: { startTime: "asc" };
		};
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

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

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
	futureMonthsPaid: number;
	nextPaymentDate: string | null;
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
					select: { parishionerId: true, membershipDate: true, joinedAt: true },
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

		let totalPaid = 0;
		for (const payment of payments) {
			totalPaid += payment.amount;
		}

		const currentMonth =
			targetYear === new Date().getFullYear() ?
				new Date().getMonth() + 1
			:	12;
			
		const memberInfo = society.members[0];
		const startCalculationDate = memberInfo?.membershipDate || memberInfo?.joinedAt || startOfYear;
		
		let startMonth = 1;
		if (startCalculationDate.getFullYear() > targetYear) {
			startMonth = 13;
		} else if (startCalculationDate.getFullYear() === targetYear) {
			startMonth = startCalculationDate.getMonth() + 1;
		}

		const dueAmount = society.monthlyDueAmount || 0;
		const monthsPaid: number[] = [];
		const monthsOwing: number[] = [];
		
		const paidMonthsCount = dueAmount > 0 ? Math.floor(totalPaid / dueAmount) : 0;
		const maxMonth = Math.max(currentMonth, startMonth + paidMonthsCount - 1);

		for (let month = startMonth; month <= maxMonth; month++) {
			const monthsSinceStart = month - startMonth;
			if (monthsSinceStart < paidMonthsCount) {
				monthsPaid.push(month);
			} else if (month <= currentMonth) {
				monthsOwing.push(month);
			}
		}

		const totalOwing = Math.max(0, dueAmount * monthsOwing.length);
		const nextDueMonth = monthsOwing.length > 0 ? monthsOwing[0] : null;

		const futureMonthsPaid = Math.max(0, paidMonthsCount - (currentMonth - startMonth + 1));
		let nextPaymentDate: string | null = null;
		if (dueAmount > 0) {
			if (monthsOwing.length > 0) {
				const oldestOwingMonth = monthsOwing[0];
				nextPaymentDate = `${MONTH_NAMES[oldestOwingMonth - 1]} ${targetYear}`;
			} else {
				const nextDueMonthIndex = startMonth + paidMonthsCount;
				const nextMonthYearOffset = Math.floor((nextDueMonthIndex - 1) / 12);
				const nextMonthVal = ((nextDueMonthIndex - 1) % 12) + 1;
				const nextYear = targetYear + nextMonthYearOffset;
				nextPaymentDate = `${MONTH_NAMES[nextMonthVal - 1]} ${nextYear}`;
			}
		}

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
				futureMonthsPaid,
				nextPaymentDate,
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

		// Validate leadership eligibility and uniqueness before create.
		if (presidentId || secretaryId) {
			const leaderIds = [presidentId, secretaryId].filter(
				Boolean,
			) as string[];
			const [leaders, conflicts] = await Promise.all([
				db.parishioner.findMany({
					where: {
						id: { in: leaderIds },
						organizationId: session.user.organizationId,
						isActive: true,
					},
					select: { id: true },
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
			const leaderIdSet = new Set(leaders.map((leader) => leader.id));

			if (presidentId) {
				if (!leaderIdSet.has(presidentId)) {
					fieldErrors.presidentId = [
						"Selected president must be an active parishioner in this organization",
					];
				}
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

			if (secretaryId) {
				if (!leaderIdSet.has(secretaryId)) {
					fieldErrors.secretaryId = [
						"Selected secretary must be an active parishioner in this organization",
					];
				}
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

		const isLeader = isSocietyLeaderForSession(existing, session);
		if (!canManageSocieties(session.user.role) && !isLeader) {
			return { success: false, message: "Permission denied" };
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

export type JoinRequestWithParishionerAndSociety = Prisma.SocietyJoinRequestGetPayload<{
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
		society: {
			select: {
				id: true;
				name: true;
			};
		};
	};
}>;

export type PublicSocietyItem = {
	id: string;
	name: string;
	description: string | null;
	patronSaint: string | null;
	meetingSchedule: string | null;
	monthlyDueAmount: number | null;
	organizationId: string;
	memberCount: number;
	presidentName: string | null;
	secretaryName: string | null;
	userStatus:
		| "NONE"
		| "MEMBER"
		| "PENDING"
		| "REJECTED"
		| "WRONG_PARISH"
		| "WRONG_ROLE"
		| "UNAUTHENTICATED";
};

export async function getPublicSocietiesForParish(
	parishId: string,
): Promise<ActionResponse<PublicSocietyItem[]>> {
	try {
		const enabled = await isFeatureEnabled(parishId, "enableSocieties");
		if (!enabled) {
			return {
				success: true,
				message: "Societies are disabled for this parish",
				data: [],
			};
		}

		const [societies, session] = await Promise.all([
			db.society.findMany({
				where: { organizationId: parishId },
				select: {
					id: true,
					name: true,
					description: true,
					patronSaint: true,
					meetingSchedule: true,
					monthlyDueAmount: true,
					organizationId: true,
					president: {
						select: {
							firstName: true,
							lastName: true,
						},
					},
					secretary: {
						select: {
							firstName: true,
							lastName: true,
						},
					},
					_count: {
						select: { members: true },
					},
				},
				orderBy: { name: "asc" },
			}),
			auth(),
		]);

		let userParishionerId: string | null = session?.user?.parishionerId ?? null;
		if (session?.user && !userParishionerId && session.user.email) {
			const parishioner = await db.parishioner.findUnique({
				where: { email: session.user.email },
				select: { id: true },
			});
			userParishionerId = parishioner?.id ?? null;
		}

		const societyIds = societies.map((s) => s.id);
		let memberMap = new Set<string>();
		let requestMap = new Map<string, string>();

		if (session?.user && userParishionerId && societyIds.length > 0) {
			const [memberships, requests] = await Promise.all([
				db.societyMembership.findMany({
					where: {
						parishionerId: userParishionerId,
						societyId: { in: societyIds },
					},
					select: { societyId: true },
				}),
				db.societyJoinRequest.findMany({
					where: {
						parishionerId: userParishionerId,
						societyId: { in: societyIds },
					},
					select: { societyId: true, status: true },
				}),
			]);

			memberMap = new Set(memberships.map((m) => m.societyId));
			requestMap = new Map(requests.map((r) => [r.societyId, r.status]));
		}

		const allowedRoles = [
			"PARISHIONER",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"SOCIETY_PRESIDENT",
			"SOCIETY_SECRETARY",
		];

		const data: PublicSocietyItem[] = societies.map((s) => {
			let userStatus: PublicSocietyItem["userStatus"] = "UNAUTHENTICATED";

			if (session?.user) {
				if (session.user.organizationId !== s.organizationId) {
					userStatus = "WRONG_PARISH";
				} else if (!allowedRoles.includes(session.user.role)) {
					userStatus = "WRONG_ROLE";
				} else if (memberMap.has(s.id)) {
					userStatus = "MEMBER";
				} else if (requestMap.has(s.id)) {
					const status = requestMap.get(s.id);
					userStatus =
						status === "PENDING"
							? "PENDING"
							: status === "REJECTED"
							? "REJECTED"
							: "NONE";
				} else {
					userStatus = "NONE";
				}
			}

			return {
				id: s.id,
				name: s.name,
				description: s.description,
				patronSaint: s.patronSaint,
				meetingSchedule: s.meetingSchedule,
				monthlyDueAmount: s.monthlyDueAmount,
				organizationId: s.organizationId,
				memberCount: s._count.members,
				presidentName: s.president
					? `${s.president.firstName} ${s.president.lastName}`
					: null,
				secretaryName: s.secretary
					? `${s.secretary.firstName} ${s.secretary.lastName}`
					: null,
				userStatus,
			};
		});

		return {
			success: true,
			message: "Societies retrieved successfully",
			data,
		};
	} catch (error) {
		console.error("Failed to get public societies:", error);
		return { success: false, message: "Failed to load societies", data: [] };
	}
}

export async function getSocietyJoinContext(societyId: string): Promise<
	ActionResponse<{
		society: PublicSocietyItem | null;
		userStatus: PublicSocietyItem["userStatus"];
	}>
> {
	try {
		const session = await auth();
		const society = await db.society.findUnique({
			where: { id: societyId },
			select: {
				id: true,
				name: true,
				description: true,
				patronSaint: true,
				meetingSchedule: true,
				monthlyDueAmount: true,
				organizationId: true,
				president: { select: { firstName: true, lastName: true } },
				secretary: { select: { firstName: true, lastName: true } },
				_count: { select: { members: true } },
			},
		});

		if (!society) {
			return {
				success: false,
				message: "Society not found",
				data: { society: null, userStatus: "NONE" },
			};
		}

		if (!session?.user) {
			return {
				success: true,
				message: "Society retrieved",
				data: {
					society: {
						id: society.id,
						name: society.name,
						description: society.description,
						patronSaint: society.patronSaint,
						meetingSchedule: society.meetingSchedule,
						monthlyDueAmount: society.monthlyDueAmount,
						organizationId: society.organizationId,
						memberCount: society._count.members,
						presidentName: society.president
							? `${society.president.firstName} ${society.president.lastName}`
							: null,
						secretaryName: society.secretary
							? `${society.secretary.firstName} ${society.secretary.lastName}`
							: null,
						userStatus: "UNAUTHENTICATED",
					},
					userStatus: "UNAUTHENTICATED",
				},
			};
		}

		let userParishionerId: string | null =
			session.user.parishionerId ?? null;
		if (!userParishionerId && session.user.email) {
			const parishioner = await db.parishioner.findUnique({
				where: { email: session.user.email },
				select: { id: true },
			});
			userParishionerId = parishioner?.id ?? null;
		}

		const allowedRoles = [
			"PARISHIONER",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"SOCIETY_PRESIDENT",
			"SOCIETY_SECRETARY",
		];

		let userStatus: PublicSocietyItem["userStatus"] = "NONE";

		if (session.user.organizationId !== society.organizationId) {
			userStatus = "WRONG_PARISH";
		} else if (!allowedRoles.includes(session.user.role)) {
			userStatus = "WRONG_ROLE";
		} else if (userParishionerId) {
			const [membership, joinRequest] = await Promise.all([
				db.societyMembership.findUnique({
					where: {
						parishionerId_societyId: {
							parishionerId: userParishionerId,
							societyId,
						},
					},
					select: { parishionerId: true },
				}),
				db.societyJoinRequest.findUnique({
					where: {
						parishionerId_societyId: {
							parishionerId: userParishionerId,
							societyId,
						},
					},
					select: { status: true },
				}),
			]);

			if (membership) {
				userStatus = "MEMBER";
			} else if (joinRequest?.status === "PENDING") {
				userStatus = "PENDING";
			} else if (joinRequest?.status === "REJECTED") {
				userStatus = "REJECTED";
			} else {
				userStatus = "NONE";
			}
		}

		const societyItem: PublicSocietyItem = {
			id: society.id,
			name: society.name,
			description: society.description,
			patronSaint: society.patronSaint,
			meetingSchedule: society.meetingSchedule,
			monthlyDueAmount: society.monthlyDueAmount,
			organizationId: society.organizationId,
			memberCount: society._count.members,
			presidentName: society.president
				? `${society.president.firstName} ${society.president.lastName}`
				: null,
			secretaryName: society.secretary
				? `${society.secretary.firstName} ${society.secretary.lastName}`
				: null,
			userStatus,
		};

		return {
			success: true,
			message: "Society join context retrieved",
			data: {
				society: societyItem,
				userStatus,
			},
		};
	} catch (error) {
		console.error("Failed to get society join context:", error);
		return {
			success: false,
			message: "Failed to retrieve society details",
			data: { society: null, userStatus: "NONE" },
		};
	}
}

export async function requestToJoinSociety(
	societyId: string,
	message?: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Please log in to join a society" };
		}

		const targetSociety = await db.society.findUnique({
			where: { id: societyId },
			select: { id: true, name: true, organizationId: true },
		});
		if (!targetSociety) {
			return { success: false, message: "Society not found" };
		}

		if (session.user.organizationId !== targetSociety.organizationId) {
			return {
				success: false,
				message: "You can only join societies in your registered parish.",
			};
		}

		const allowedRoles = [
			"PARISHIONER",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"SOCIETY_PRESIDENT",
			"SOCIETY_SECRETARY",
		];
		if (!allowedRoles.includes(session.user.role)) {
			return {
				success: false,
				message:
					"You do not have the appropriate roles to join this society.",
			};
		}

		const enabled = await isFeatureEnabled(
			targetSociety.organizationId,
			"enableSocieties",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Societies feature is not enabled for this parish",
			};
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

		const canAutoJoin = ["PARISH_ADMIN", "PARISH_SECRETARY"].includes(
			session.user.role,
		);
		if (canAutoJoin) {
			await db.$transaction([
				db.societyMembership.create({
					data: {
						parishionerId,
						societyId,
						role: "MEMBER",
					},
				}),
				db.societyJoinRequest.deleteMany({
					where: { parishionerId, societyId },
				}),
			]);

			revalidatePath("/dashboard/societies");
			revalidatePath(`/dashboard/societies/${societyId}`);
			revalidatePath("/societies");
			revalidatePath(`/societies/${societyId}`);
			revalidatePath(`/p/${targetSociety.organizationId}`);
			revalidatePath(`/p/${targetSociety.organizationId}/societies`);
			revalidatePath(
				`/p/${targetSociety.organizationId}/societies/${societyId}`,
			);

			return {
				success: true,
				message: "You have joined this society",
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
		revalidatePath(`/p/${targetSociety.organizationId}`);
		revalidatePath(`/p/${targetSociety.organizationId}/societies`);
		revalidatePath(
			`/p/${targetSociety.organizationId}/societies/${societyId}`,
		);

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

		const isSocietyLeader = isSocietyLeaderForSession(society, session);

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

		const isSocietyLeader = isSocietyLeaderForSession(
			request.society,
			session,
		);

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

		const isSocietyLeader = isSocietyLeaderForSession(
			request.society,
			session,
		);

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

		const parishionerId = session.user.parishionerId ?? null;
		if (!parishionerId) {
			return {
				success: false,
				message: "You are not a leader of any society",
			};
		}

		const society = await db.society.findFirst({
			where: {
				organizationId: session.user.organizationId,
				OR: [
					{ presidentId: parishionerId },
					{ secretaryId: parishionerId },
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
	futureMonthsPaid: number;
	nextPaymentDate: string | null;
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

		const isSocietyLeader = isSocietyLeaderForSession(societyData, session);

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

		// Build lookup: parishionerId -> Total amount paid
		const paidMap = new Map<string, number>();
		for (const p of payments) {
			if (p.parishionerId) {
				paidMap.set(
					p.parishionerId,
					(paidMap.get(p.parishionerId) || 0) + p.amount
				);
			}
		}

		const currentMonth =
			targetYear === new Date().getFullYear() ?
				new Date().getMonth() + 1
			:	12;
		const dueAmount = societyData.monthlyDueAmount || 0;

		const members: MemberDuesStatus[] = societyData.members.map((m) => {
			const parishioner = m.parishioner;
			const totalPaid = paidMap.get(parishioner.id) || 0;
			const monthsPaid: number[] = [];
			const monthsOwing: number[] = [];

			const startCalculationDate = m.membershipDate || m.joinedAt || startOfYear;
			let startMonth = 1;
			if (startCalculationDate.getFullYear() > targetYear) {
				startMonth = 13;
			} else if (startCalculationDate.getFullYear() === targetYear) {
				startMonth = startCalculationDate.getMonth() + 1;
			}

			const paidMonthsCount = dueAmount > 0 ? Math.floor(totalPaid / dueAmount) : 0;
			const maxMonth = Math.max(currentMonth, startMonth + paidMonthsCount - 1);

			for (let month = startMonth; month <= maxMonth; month++) {
				const monthsSinceStart = month - startMonth;
				if (monthsSinceStart < paidMonthsCount) {
					monthsPaid.push(month);
				} else if (month <= currentMonth) {
					monthsOwing.push(month);
				}
			}

			const totalOwing =
				dueAmount > 0 ? monthsOwing.length * dueAmount : 0;

			const futureMonthsPaid = Math.max(0, paidMonthsCount - (currentMonth - startMonth + 1));
			let nextPaymentDate: string | null = null;
			if (dueAmount > 0) {
				if (monthsOwing.length > 0) {
					const oldestOwingMonth = monthsOwing[0];
					nextPaymentDate = `${MONTH_NAMES[oldestOwingMonth - 1]} ${targetYear}`;
				} else {
					const nextDueMonthIndex = startMonth + paidMonthsCount;
					const nextMonthYearOffset = Math.floor((nextDueMonthIndex - 1) / 12);
					const nextMonthVal = ((nextDueMonthIndex - 1) % 12) + 1;
					const nextYear = targetYear + nextMonthYearOffset;
					nextPaymentDate = `${MONTH_NAMES[nextMonthVal - 1]} ${nextYear}`;
				}
			}

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
				futureMonthsPaid,
				nextPaymentDate,
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

		const isSocietyLeader = isSocietyLeaderForSession(society, session);

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

		const isSocietyLeader = isSocietyLeaderForSession(society, session);

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

		const currentDate = new Date();
		const paymentDate =
			formData.year === currentDate.getFullYear() ?
				currentDate
			:	new Date(formData.year, 11, 31); // End of the specified year

		await db.payment.create({
			data: {
				amount: formData.amount,
				currency: "NGN",
				purpose: "SOCIETY_DUES",
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
	membershipDate: Date | null;
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

		const isSocietyLeader = isSocietyLeaderForSession(society, session);

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
			membershipDate: m.membershipDate,
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

		const isSocietyLeader = isSocietyLeaderForSession(society, session);

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

export async function updateMembershipDate(
	societyId: string,
	parishionerId: string,
	membershipDate: Date | null,
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

		const isSocietyLeader = isSocietyLeaderForSession(society, session);

		if (!canManageSocieties(session.user.role) && !isSocietyLeader) {
			return { success: false, message: "Permission denied" };
		}

		await db.societyMembership.update({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
			data: {
				membershipDate,
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}/manage`);
		revalidatePath(`/dashboard/societies/${societyId}`);
		revalidatePath(`/dashboard/societies`);

		return {
			success: true,
			message: "Membership start date updated successfully",
		};
	} catch (error) {
		console.error("Failed to update membership date:", error);
		return { success: false, message: "Failed to update membership date" };
	}
}
