"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import type { ActionResponse } from "@/types";
import type { Organization, Parishioner, Society, User } from "@prisma/client";
import { cookies } from "next/headers";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SystemMetrics {
	totalParishes: number;
	totalOutstations: number;
	totalUsers: number;
	totalParishioners: number;
	totalSocieties: number;
	totalSacramentalRecords: number;
	recentActivityCount: number;
}

export interface OrganizationWithMetrics extends Organization {
	_count: {
		users: number;
		parishioners: number;
		societies: number;
		children: number;
		baptisms: number;
		confirmations: number;
		marriages: number;
	};
	parent?: {
		id: string;
		name: string;
	} | null;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface RecentActivity {
	id: string;
	type:
		| "user_created"
		| "parishioner_created"
		| "society_created"
		| "sacramental_record";
	organizationId: string;
	organizationName: string;
	description: string;
	createdAt: Date;
}

// ============================================
// PERMISSION HELPERS
// ============================================

async function requireSuperAdmin() {
	const session = await auth();
	if (!session?.user || session.user.role !== "SUPER_ADMIN") {
		throw new Error("Unauthorized: Super Admin access required");
	}
	return session;
}

// ============================================
// SYSTEM METRICS
// ============================================

/**
 * Get system-wide metrics for dashboard overview
 */
export async function getSystemMetrics(): Promise<
	ActionResponse<SystemMetrics>
> {
	try {
		await requireSuperAdmin();

		const [
			totalParishes,
			totalOutstations,
			totalUsers,
			totalParishioners,
			totalSocieties,
			totalBaptisms,
			totalConfirmations,
			totalMarriages,
		] = await Promise.all([
			db.organization.count({ where: { level: "PARISH" } }),
			db.organization.count({ where: { level: "OUTSTATION" } }),
			db.user.count(),
			db.parishioner.count(),
			db.society.count(),
			db.baptism.count(),
			db.confirmation.count(),
			db.marriage.count(),
		]);

		const totalSacramentalRecords =
			totalBaptisms + totalConfirmations + totalMarriages;

		const metrics: SystemMetrics = {
			totalParishes,
			totalOutstations,
			totalUsers,
			totalParishioners,
			totalSocieties,
			totalSacramentalRecords,
			recentActivityCount: 0, // Placeholder for now
		};

		return {
			success: true,
			message: "System metrics retrieved",
			data: metrics,
		};
	} catch (error) {
		console.error("Get system metrics error:", error);
		return {
			success: false,
			message:
				error instanceof Error ?
					error.message
				:	"Failed to fetch system metrics",
		};
	}
}

// ============================================
// ORGANIZATION MANAGEMENT
// ============================================

/**
 * Get all organizations with metrics and pagination
 */
export async function getAllOrganizationsWithMetrics(
	page: number = 1,
	pageSize: number = 20,
	searchQuery?: string,
	level?: "PARISH" | "OUTSTATION",
): Promise<ActionResponse<PaginatedResult<OrganizationWithMetrics>>> {
	try {
		await requireSuperAdmin();

		const where = {
			...(searchQuery && {
				name: { contains: searchQuery, mode: "insensitive" as const },
			}),
			...(level && { level }),
		};

		const [organizations, total] = await Promise.all([
			db.organization.findMany({
				where,
				include: {
					_count: {
						select: {
							users: true,
							parishioners: true,
							societies: true,
							children: true,
							baptisms: true,
							confirmations: true,
							marriages: true,
						},
					},
					parent: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: { name: "asc" },
				skip: (page - 1) * pageSize,
				take: pageSize,
			}),
			db.organization.count({ where }),
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			success: true,
			message: "Organizations retrieved",
			data: {
				data: organizations,
				total,
				page,
				pageSize,
				totalPages,
			},
		};
	} catch (error) {
		console.error("Get organizations error:", error);
		return {
			success: false,
			message:
				error instanceof Error ?
					error.message
				:	"Failed to fetch organizations",
		};
	}
}

/**
 * Get organization detail with limited related entities
 */
export async function getOrganizationDetailedView(
	organizationId: string,
	limit: number = 5,
): Promise<
	ActionResponse<{
		organization: Organization;
		users: User[];
		parishioners: Parishioner[];
		societies: Society[];
		outstations: Organization[];
		baptisms: any[];
		confirmations: any[];
		marriages: any[];
		counts: {
			totalUsers: number;
			totalParishioners: number;
			totalSocieties: number;
			totalOutstations: number;
			totalBaptisms: number;
			totalConfirmations: number;
			totalMarriages: number;
		};
	}>
> {
	try {
		await requireSuperAdmin();

		const organization = await db.organization.findUnique({
			where: { id: organizationId },
		});

		if (!organization) {
			return {
				success: false,
				message: "Organization not found",
			};
		}

		const [
			users,
			parishioners,
			societies,
			outstations,
			baptisms,
			confirmations,
			marriages,
		] = await Promise.all([
			db.user.findMany({
				where: { organizationId },
				orderBy: { createdAt: "desc" },
				take: limit,
			}),
			db.parishioner.findMany({
				where: { organizationId },
				orderBy: { createdAt: "desc" },
				take: limit,
			}),
			db.society.findMany({
				where: { organizationId },
				orderBy: { createdAt: "desc" },
				take: limit,
			}),
			organization.level === "PARISH" ?
				db.organization.findMany({
					where: { parentId: organizationId },
					orderBy: { name: "asc" },
					take: limit,
				})
			:	Promise.resolve([]),
			db.baptism.findMany({
				where: { organizationId },
				take: limit,
				orderBy: { date: "desc" },
			}),
			db.confirmation.findMany({
				where: { organizationId },
				take: limit,
				orderBy: { date: "desc" },
			}),
			db.marriage.findMany({
				where: { organizationId },
				take: limit,
				orderBy: { date: "desc" },
			}),
		]);

		// Get counts separately to avoid transaction type issues
		const [
			totalUsers,
			totalParishioners,
			totalSocieties,
			totalBaptisms,
			totalConfirmations,
			totalMarriages,
		] = await db.$transaction([
			db.user.count({ where: { organizationId } }),
			db.parishioner.count({ where: { organizationId } }),
			db.society.count({ where: { organizationId } }),
			db.baptism.count({ where: { organizationId } }),
			db.confirmation.count({ where: { organizationId } }),
			db.marriage.count({ where: { organizationId } }),
		]);

		const totalOutstations =
			organization.level === "PARISH" ?
				await db.organization.count({
					where: { parentId: organizationId },
				})
			:	0;

		return {
			success: true,
			message: "Organization details retrieved",
			data: {
				organization,
				users,
				parishioners,
				societies,
				outstations,
				baptisms,
				confirmations,
				marriages,
				counts: {
					totalUsers,
					totalParishioners,
					totalSocieties,
					totalOutstations,
					totalBaptisms,
					totalConfirmations,
					totalMarriages,
				},
			},
		};
	} catch (error) {
		console.error("Get organization detailed view error:", error);
		return {
			success: false,
			message:
				error instanceof Error ?
					error.message
				:	"Failed to fetch organization details",
		};
	}
}

// ============================================
// CONTEXT SWITCHING
// ============================================

/**
 * Set the organization context for a super admin session
 * This allows super admins to "view as" a specific organization
 */
export async function setOrganizationContext(
	organizationId: string | null,
): Promise<ActionResponse<{ organizationId: string | null }>> {
	try {
		const session = await requireSuperAdmin();
		const cookieStore = await cookies();
		const contextCookieName = "org-context-id";

		// Verify organization exists if provided
		if (organizationId) {
			const org = await db.organization.findUnique({
				where: { id: organizationId },
			});

			if (!org) {
				return {
					success: false,
					message: "Organization not found",
				};
			}
		}

		if (organizationId) {
			cookieStore.set(contextCookieName, organizationId, {
				httpOnly: true,
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
				path: "/",
				maxAge: 60 * 60 * 24 * 7,
			});
		} else {
			cookieStore.delete(contextCookieName);
		}

		return {
			success: true,
			message:
				organizationId ?
					"Organization context set"
				:	"Organization context cleared",
			data: { organizationId },
		};
	} catch (error) {
		console.error("Set organization context error:", error);
		return {
			success: false,
			message:
				error instanceof Error ?
					error.message
				:	"Failed to set organization context",
		};
	}
}

// ============================================
// RECENT ACTIVITY
// ============================================

/**
 * Get recent system-wide activity
 */
export async function getRecentSystemActivity(
	limit: number = 20,
): Promise<ActionResponse<RecentActivity[]>> {
	try {
		await requireSuperAdmin();

		// Get recent users
		const recentUsers = await db.user.findMany({
			where: { role: { not: "SUPER_ADMIN" } },
			include: { organization: { select: { name: true } } },
			orderBy: { createdAt: "desc" },
			take: limit,
		});

		// Get recent parishioners
		const recentParishioners = await db.parishioner.findMany({
			include: { organization: { select: { name: true } } },
			orderBy: { createdAt: "desc" },
			take: limit,
		});

		// Get recent societies
		const recentSocieties = await db.society.findMany({
			include: { organization: { select: { name: true } } },
			orderBy: { createdAt: "desc" },
			take: limit,
		});

		// Combine and sort all activities
		const activities: RecentActivity[] = [
			...recentUsers.map((user) => ({
				id: user.id,
				type: "user_created" as const,
				organizationId: user.organizationId,
				organizationName: user.organization.name,
				description: `New user: ${user.firstName} ${user.lastName} (${user.role})`,
				createdAt: user.createdAt,
			})),
			...recentParishioners.map((p) => ({
				id: p.id,
				type: "parishioner_created" as const,
				organizationId: p.organizationId,
				organizationName: p.organization.name,
				description: `New parishioner: ${p.firstName} ${p.lastName}`,
				createdAt: p.createdAt,
			})),
			...recentSocieties.map((s) => ({
				id: s.id,
				type: "society_created" as const,
				organizationId: s.organizationId,
				organizationName: s.organization.name,
				description: `New society: ${s.name}`,
				createdAt: s.createdAt,
			})),
		]
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			.slice(0, limit);

		return {
			success: true,
			message: "Recent activity retrieved",
			data: activities,
		};
	} catch (error) {
		console.error("Get recent activity error:", error);
		return {
			success: false,
			message:
				error instanceof Error ?
					error.message
				:	"Failed to fetch recent activity",
		};
	}
}
