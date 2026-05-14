"use server";

import { configureOutstationPaystackProfile } from "@/app/actions/paystack.actions";
import { auth } from "@/auth";
import db from "@/lib/db";
import { canManageSocieties } from "@/lib/permissions";
import { organizationPaystackProfileSchema } from "@/lib/validators/paystack.schema";
import {
	changePasswordSchema,
	createUserSchema,
	updateUserSchema,
} from "@/lib/validators/user.schema";
import type { ActionResponse } from "@/types";
import { Prisma, type User, type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// Type for user without password (safe to return)
type SafeUser = Omit<User, "password">;

// Role hierarchy for authorization checks
const ROLE_HIERARCHY: Record<string, number> = {
	SUPER_ADMIN: 100,
	PARISH_ADMIN: 80,
	PARISH_SECRETARY: 60,
	PARISH_STAFF: 40,
	OUTSTATION_ADMIN: 40,
	SOCIETY_PRESIDENT: 30,
	SOCIETY_SECRETARY: 30,
	PARISHIONER: 10,
};

// Roles that can manage users
const USER_MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "PARISH_ADMIN"];

// Helper function to check if user can manage other users
function canManageUsers(role: string): boolean {
	return USER_MANAGEMENT_ROLES.includes(role as UserRole);
}

// Helper function to check if actor can modify target user's role
function canAssignRole(actorRole: string, targetRole: string): boolean {
	const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
	const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
	return actorLevel > targetLevel;
}

async function getManagedOrganizationIds(session: {
	user: { role: string; organizationId: string };
}): Promise<string[]> {
	if (session.user.role !== "PARISH_ADMIN") {
		return [session.user.organizationId];
	}

	const outstations = await db.organization.findMany({
		where: {
			parentId: session.user.organizationId,
			level: "OUTSTATION",
		},
		select: { id: true },
	});

	return [
		session.user.organizationId,
		...outstations.map((outstation) => outstation.id),
	];
}

// Helper to omit password from user object
function omitPassword(user: User): SafeUser {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { password, ...safeUser } = user;
	return safeUser;
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all users for the current organization
 * Super admins can see all platform users
 * Org admins can only see their org's users
 */
export async function getUsers(
	includeOrganization = false,
): Promise<
	ActionResponse<
		(SafeUser & { organization?: { id: string; name: string } | null })[]
	>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only admins can view users
		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to view users",
			};
		}

		// Super admins see all users across all organizations
		// Parish admins see parish + outstations
		const where =
			session.user.role === "SUPER_ADMIN" ?
				{}
			:	{
					organizationId: {
						in: await getManagedOrganizationIds(session),
					},
				};

		const users = await db.user.findMany({
			where,
			include: includeOrganization ? { organization: true } : undefined,
			orderBy: { createdAt: "desc" },
		});

		return {
			success: true,
			message: "Users retrieved successfully",
			data: users.map((user) => {
				const safeUser = omitPassword(user);
				if (includeOrganization) {
					const userWithOrg = user as unknown as {
						organization: { id: string; name: string } | null;
					};
					return {
						...safeUser,
						organization:
							userWithOrg.organization ?
								{
									id: userWithOrg.organization.id,
									name: userWithOrg.organization.name,
								}
							:	null,
					};
				}
				return safeUser;
			}),
		};
	} catch (error) {
		console.error("Failed to get users:", error);
		return { success: false, message: "Failed to retrieve users" };
	}
}

/**
 * Get users eligible to be selected as society leaders.
 * Scoped to current organization and roles allowed to manage societies.
 */
export async function getSocietyLeaderCandidates(params?: {
	page?: number;
	limit?: number;
	query?: string;
}): Promise<
	ActionResponse<{
		users: Pick<User, "id" | "firstName" | "lastName" | "role">[];
		total: number;
		page: number;
		limit: number;
	}>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageSocieties(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to view users",
			};
		}

		const page = Math.max(1, params?.page ?? 1);
		const limit = Math.min(Math.max(params?.limit ?? 50, 1), 100);
		const query = params?.query?.trim();
		const where = {
			organizationId: session.user.organizationId,
			isActive: true,
			...(query && {
				OR: [
					{
						firstName: {
							contains: query,
							mode: Prisma.QueryMode.insensitive,
						},
					},
					{
						lastName: {
							contains: query,
							mode: Prisma.QueryMode.insensitive,
						},
					},
					{
						email: {
							contains: query,
							mode: Prisma.QueryMode.insensitive,
						},
					},
					{
						phone: {
							contains: query,
							mode: Prisma.QueryMode.insensitive,
						},
					},
				],
			}),
		};
		const [users, total] = await Promise.all([
			db.user.findMany({
				where,
				select: {
					id: true,
					firstName: true,
					lastName: true,
					role: true,
				},
				orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
				skip: (page - 1) * limit,
				take: limit,
			}),
			db.user.count({ where }),
		]);

		return {
			success: true,
			message: "Society leader candidates retrieved successfully",
			data: { users, total, page, limit },
		};
	} catch (error) {
		console.error("Failed to get society leader candidates:", error);
		return {
			success: false,
			message: "Failed to retrieve society leader candidates",
		};
	}
}

/**
 * Get staff members (users who can be assigned to appointments)
 */
export async function getStaffMembers(): Promise<ActionResponse<SafeUser[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Staff roles that can be assigned to appointments
		const staffRoles = [
			"SUPER_ADMIN",
			"PARISH_ADMIN",
			"PARISH_SECRETARY",
			"PARISH_STAFF",
			"OUTSTATION_ADMIN",
		];

		const staff = await db.user.findMany({
			where: {
				organizationId: session.user.organizationId,
				role: { in: staffRoles as UserRole[] },
				isActive: true,
			},
			orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
		});

		return {
			success: true,
			message: "Staff members retrieved successfully",
			data: staff.map(omitPassword),
		};
	} catch (error) {
		console.error("Failed to get staff members:", error);
		return { success: false, message: "Failed to retrieve staff members" };
	}
}

/**
 * Get a single user by ID
 */
export async function getUser(
	id: string,
): Promise<ActionResponse<SafeUser & { organization: { name: string } }>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only admins can view user details
		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to view user details",
			};
		}

		const where =
			session.user.role === "SUPER_ADMIN" ?
				{ id }
			:	{
					id,
					organizationId: {
						in: await getManagedOrganizationIds(session),
					},
				};

		const user = await db.user.findFirst({
			where,
			include: {
				organization: {
					select: { name: true },
				},
			},
		});

		if (!user) {
			return { success: false, message: "User not found" };
		}

		const safeUser = omitPassword(user);

		return {
			success: true,
			message: "User retrieved successfully",
			data: { ...safeUser, organization: user.organization },
		};
	} catch (error) {
		console.error("Failed to get user:", error);
		return { success: false, message: "Failed to retrieve user" };
	}
}

/**
 * Search users
 */
export async function searchUsers(
	searchTerm: string,
): Promise<ActionResponse<SafeUser[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to search users",
			};
		}

		const where =
			session.user.role === "SUPER_ADMIN" ?
				{
					OR: [
						{
							firstName: {
								contains: searchTerm,
								mode: Prisma.QueryMode.insensitive,
							},
						},
						{
							lastName: {
								contains: searchTerm,
								mode: Prisma.QueryMode.insensitive,
							},
						},
						{
							email: {
								contains: searchTerm,
								mode: Prisma.QueryMode.insensitive,
							},
						},
					],
				}
			:	{
					organizationId: {
						in: await getManagedOrganizationIds(session),
					},
					OR: [
						{
							firstName: {
								contains: searchTerm,
								mode: Prisma.QueryMode.insensitive,
							},
						},
						{
							lastName: {
								contains: searchTerm,
								mode: Prisma.QueryMode.insensitive,
							},
						},
						{
							email: {
								contains: searchTerm,
								mode: Prisma.QueryMode.insensitive,
							},
						},
					],
				};

		const users = await db.user.findMany({
			where,
			orderBy: { lastName: "asc" },
			take: 50,
		});

		return {
			success: true,
			message: "Users found",
			data: users.map(omitPassword),
		};
	} catch (error) {
		console.error("Failed to search users:", error);
		return { success: false, message: "Failed to search users" };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create a new user
 */
export async function createUser(
	formData: unknown,
): Promise<ActionResponse<SafeUser>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only admins can create users
		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to create users",
			};
		}

		// Validate input
		const parsed = createUserSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Please check your input and try again",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const {
			firstName,
			lastName,
			email,
			password,
			role,
			outstationId,
			paystackProfile,
		} = parsed.data;

		// Check if actor can assign this role
		if (!canAssignRole(session.user.role, role)) {
			return {
				success: false,
				message:
					"You cannot assign a role equal or higher than your own",
			};
		}

		// Check if email already exists
		const existingUser = await db.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return {
				success: false,
				message: "A user with this email already exists",
				errors: { email: ["This email is already registered"] },
			};
		}

		let targetOrganizationId = session.user.organizationId;

		if (role === "OUTSTATION_ADMIN") {
			if (!outstationId) {
				return {
					success: false,
					message: "Outstation is required for outstation admins",
					errors: { outstationId: ["Outstation is required"] },
				};
			}

			const outstation = await db.organization.findFirst({
				where: {
					id: outstationId,
					level: "OUTSTATION",
					...(session.user.role === "PARISH_ADMIN" && {
						parentId: session.user.organizationId,
					}),
				},
				select: { id: true },
			});

			if (!outstation) {
				return {
					success: false,
					message: "Invalid outstation selection",
					errors: { outstationId: ["Invalid outstation selection"] },
				};
			}

			const paystackParsed = organizationPaystackProfileSchema.safeParse(
				paystackProfile ?? {},
			);
			if (!paystackParsed.success) {
				const fieldErrors =
					paystackParsed.error.flatten().fieldErrors || {};
				const prefixedErrors: Record<string, string[]> = {};
				Object.entries(fieldErrors).forEach(([field, messages]) => {
					prefixedErrors[`paystackProfile.${field}`] = messages;
				});
				return {
					success: false,
					message: "Payment subaccount details are required",
					errors: prefixedErrors,
				};
			}

			const paystackResult = await configureOutstationPaystackProfile(
				paystackParsed.data,
				outstationId,
			);
			if (!paystackResult.success) {
				return {
					success: false,
					message:
						paystackResult.message ||
						"Failed to create payment subaccount",
					errors: paystackResult.errors,
				};
			}

			targetOrganizationId = outstationId;
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const user = await db.user.create({
			data: {
				firstName,
				lastName,
				email,
				password: hashedPassword,
				role,
				organizationId: targetOrganizationId,
				isActive: true,
			},
		});

		// Audit Log
		await db.auditLog.create({
			data: {
				action: "CREATE",
				entityType: "User",
				entityId: user.id,
				performedBy: session.user.id,
				details: {
					email: user.email,
					role: user.role,
					firstName: user.firstName,
					lastName: user.lastName,
					organizationId: targetOrganizationId,
				},
			},
		});

		revalidatePath("/users");

		return {
			success: true,
			message: "User created successfully",
			data: omitPassword(user),
		};
	} catch (error) {
		console.error("Failed to create user:", error);
		return { success: false, message: "Failed to create user" };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update a user's details
 */
export async function updateUser(
	id: string,
	formData: unknown,
): Promise<ActionResponse<SafeUser>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only admins can update users
		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to update users",
			};
		}

		// Validate input
		const parsed = updateUserSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Please check your input and try again",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify the user exists and belongs to same organization
		const existingUser = await db.user.findFirst({
			where:
				session.user.role === "SUPER_ADMIN" ?
					{ id }
				:	{
						id,
						organizationId: {
							in: await getManagedOrganizationIds(session),
						},
					},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		// Prevent modifying users with higher or equal role
		if (!canAssignRole(session.user.role, existingUser.role)) {
			return {
				success: false,
				message: "You cannot modify this user",
			};
		}

		// If role is being changed, check if actor can assign the new role
		if (
			parsed.data.role &&
			!canAssignRole(session.user.role, parsed.data.role)
		) {
			return {
				success: false,
				message:
					"You cannot assign a role equal or higher than your own",
			};
		}

		// Check if email is being changed and already exists
		if (parsed.data.email && parsed.data.email !== existingUser.email) {
			const emailExists = await db.user.findUnique({
				where: { email: parsed.data.email },
			});

			if (emailExists) {
				return {
					success: false,
					message: "This email is already in use",
					errors: { email: ["This email is already registered"] },
				};
			}
		}

		// Update user
		const user = await db.user.update({
			where: { id },
			data: parsed.data,
		});

		// Audit Log
		await db.auditLog.create({
			data: {
				action: "UPDATE",
				entityType: "User",
				entityId: id,
				performedBy: session.user.id,
				details: {
					updatedFields: Object.keys(parsed.data),
				},
			},
		});

		if (parsed.data.role && parsed.data.role !== existingUser.role) {
			await db.auditLog.create({
				data: {
					action: "PERMISSION_CHANGE",
					entityType: "Auth",
					entityId: id,
					performedBy: session.user.id,
					details: {
						fromRole: existingUser.role,
						toRole: parsed.data.role,
					},
				},
			});
		}

		revalidatePath("/users");
		revalidatePath(`/users/${id}`);

		return {
			success: true,
			message: "User updated successfully",
			data: omitPassword(user),
		};
	} catch (error) {
		console.error("Failed to update user:", error);
		return { success: false, message: "Failed to update user" };
	}
}

/**
 * Change a user's password
 */
export async function changeUserPassword(
	id: string,
	formData: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only admins can change user passwords
		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to change passwords",
			};
		}

		// Validate input
		const parsed = changePasswordSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Please check your input and try again",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify the user exists and belongs to same organization
		const existingUser = await db.user.findFirst({
			where:
				session.user.role === "SUPER_ADMIN" ?
					{ id }
				:	{
						id,
						organizationId: {
							in: await getManagedOrganizationIds(session),
						},
					},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		// Prevent modifying users with higher or equal role
		if (!canAssignRole(session.user.role, existingUser.role)) {
			return {
				success: false,
				message: "You cannot change this user's password",
			};
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

		// Update password and invalidate active sessions for the target user.
		await db.user.update({
			where: { id },
			data: {
				password: hashedPassword,
				sessionVersion: { increment: 1 },
				failedLoginAttempts: 0,
				lastFailedLoginAt: null,
				lockedUntil: null,
			},
		});

		await db.auditLog.create({
			data: {
				action: "PASSWORD_CHANGE",
				entityType: "Auth",
				entityId: id,
				performedBy: session.user.id,
				details: {
					resetByAdmin: true,
				},
			},
		});

		return {
			success: true,
			message: "Password changed successfully",
		};
	} catch (error) {
		console.error("Failed to change password:", error);
		return { success: false, message: "Failed to change password" };
	}
}

// ============================================
// ACTIVATION/DEACTIVATION OPERATIONS
// ============================================

/**
 * Toggle user active status
 */
export async function toggleUserStatus(
	id: string,
): Promise<ActionResponse<SafeUser>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only admins can toggle user status
		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to change user status",
			};
		}

		// Verify the user exists and belongs to same organization
		const existingUser = await db.user.findFirst({
			where:
				session.user.role === "SUPER_ADMIN" ?
					{ id }
				:	{
						id,
						organizationId: {
							in: await getManagedOrganizationIds(session),
						},
					},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		// Prevent deactivating yourself
		if (existingUser.id === session.user.id) {
			return {
				success: false,
				message: "You cannot deactivate your own account",
			};
		}

		// Prevent modifying users with higher or equal role
		if (!canAssignRole(session.user.role, existingUser.role)) {
			return {
				success: false,
				message: "You cannot modify this user",
			};
		}

		// Toggle status
		const user = await db.user.update({
			where: { id },
			data: { isActive: !existingUser.isActive },
		});

		// Audit Log
		await db.auditLog.create({
			data: {
				action: "UPDATE",
				entityType: "User",
				entityId: id,
				performedBy: session.user.id,
				details: {
					action: user.isActive ? "ACTIVATE" : "DEACTIVATE",
				},
			},
		});

		revalidatePath("/users");
		revalidatePath(`/users/${id}`);

		return {
			success: true,
			message:
				user.isActive ?
					"User activated successfully"
				:	"User deactivated successfully",
			data: omitPassword(user),
		};
	} catch (error) {
		console.error("Failed to toggle user status:", error);
		return { success: false, message: "Failed to change user status" };
	}
}

/**
 * Activate a user
 */
export async function activateUser(
	id: string,
): Promise<ActionResponse<SafeUser>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to activate users",
			};
		}

		const existingUser = await db.user.findFirst({
			where:
				session.user.role === "SUPER_ADMIN" ?
					{ id }
				:	{
						id,
						organizationId: {
							in: await getManagedOrganizationIds(session),
						},
					},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		if (!canAssignRole(session.user.role, existingUser.role)) {
			return {
				success: false,
				message: "You cannot modify this user",
			};
		}

		if (existingUser.isActive) {
			return {
				success: false,
				message: "User is already active",
			};
		}

		const user = await db.user.update({
			where: { id },
			data: { isActive: true },
		});

		revalidatePath("/users");

		return {
			success: true,
			message: "User activated successfully",
			data: omitPassword(user),
		};
	} catch (error) {
		console.error("Failed to activate user:", error);
		return { success: false, message: "Failed to activate user" };
	}
}

/**
 * Deactivate a user
 */
export async function deactivateUser(
	id: string,
): Promise<ActionResponse<SafeUser>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to deactivate users",
			};
		}

		const existingUser = await db.user.findFirst({
			where:
				session.user.role === "SUPER_ADMIN" ?
					{ id }
				:	{
						id,
						organizationId: {
							in: await getManagedOrganizationIds(session),
						},
					},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		if (existingUser.id === session.user.id) {
			return {
				success: false,
				message: "You cannot deactivate your own account",
			};
		}

		if (!canAssignRole(session.user.role, existingUser.role)) {
			return {
				success: false,
				message: "You cannot modify this user",
			};
		}

		if (!existingUser.isActive) {
			return {
				success: false,
				message: "User is already deactivated",
			};
		}

		const user = await db.user.update({
			where: { id },
			data: { isActive: false },
		});

		revalidatePath("/users");

		return {
			success: true,
			message: "User deactivated successfully",
			data: omitPassword(user),
		};
	} catch (error) {
		console.error("Failed to deactivate user:", error);
		return { success: false, message: "Failed to deactivate user" };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a user (hard delete - use with caution)
 */
export async function deleteUser(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only super admins can delete users
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message: "Only super admins can delete users",
			};
		}

		const existingUser = await db.user.findFirst({
			where:
				session.user.role === "SUPER_ADMIN" ?
					{ id }
				:	{
						id,
						organizationId: {
							in: await getManagedOrganizationIds(session),
						},
					},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		// Prevent deleting yourself
		if (existingUser.id === session.user.id) {
			return {
				success: false,
				message: "You cannot delete your own account",
			};
		}

		// Prevent deleting other super admins
		if (existingUser.role === "SUPER_ADMIN") {
			return {
				success: false,
				message: "You cannot delete other super admins",
			};
		}

		await db.user.delete({
			where: { id },
		});

		revalidatePath("/users");

		return {
			success: true,
			message: "User deleted successfully",
		};
	} catch (error) {
		console.error("Failed to delete user:", error);
		return { success: false, message: "Failed to delete user" };
	}
}

/**
 * Unlock a locked user account by clearing lockout fields.
 */
export async function unlockUserAccount(
	id: string,
): Promise<ActionResponse<SafeUser>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to unlock user accounts",
			};
		}

		const existingUser = await db.user.findFirst({
			where:
				session.user.role === "SUPER_ADMIN" ?
					{ id }
				:	{
						id,
						organizationId: {
							in: await getManagedOrganizationIds(session),
						},
					},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		if (!canAssignRole(session.user.role, existingUser.role)) {
			return {
				success: false,
				message: "You cannot modify this user",
			};
		}

		const user = await db.user.update({
			where: { id },
			data: {
				failedLoginAttempts: 0,
				lastFailedLoginAt: null,
				lockedUntil: null,
			},
		});

		await db.auditLog.create({
			data: {
				action: "PERMISSION_CHANGE",
				entityType: "Auth",
				entityId: id,
				performedBy: session.user.id,
				details: {
					type: "ACCOUNT_UNLOCKED",
				},
			},
		});

		revalidatePath("/users");
		revalidatePath(`/users/${id}`);

		return {
			success: true,
			message: "User account unlocked successfully",
			data: omitPassword(user),
		};
	} catch (error) {
		console.error("Failed to unlock user account:", error);
		return { success: false, message: "Failed to unlock user account" };
	}
}

/**
 * Revoke all active sessions for a specific user.
 */
export async function revokeUserSessions(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to revoke user sessions",
			};
		}

		const existingUser = await db.user.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existingUser) {
			return { success: false, message: "User not found" };
		}

		if (!canAssignRole(session.user.role, existingUser.role)) {
			return {
				success: false,
				message: "You cannot modify this user",
			};
		}

		await db.user.update({
			where: { id },
			data: { sessionVersion: { increment: 1 } },
		});

		await db.userSession.updateMany({
			where: {
				userId: id,
				revokedAt: null,
			},
			data: { revokedAt: new Date() },
		});

		await db.auditLog.create({
			data: {
				action: "PERMISSION_CHANGE",
				entityType: "Auth",
				entityId: id,
				performedBy: session.user.id,
				details: {
					type: "SESSION_REVOKE",
					target: "ALL_DEVICES",
				},
			},
		});

		return {
			success: true,
			message: "User sessions revoked successfully",
		};
	} catch (error) {
		console.error("Failed to revoke user sessions:", error);
		return { success: false, message: "Failed to revoke user sessions" };
	}
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user statistics for dashboard
 */
export async function getUserStats(): Promise<
	ActionResponse<{
		total: number;
		active: number;
		inactive: number;
		byRole: Record<string, number>;
	}>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canManageUsers(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to view user statistics",
			};
		}

		const managedOrganizationIds =
			session.user.role === "SUPER_ADMIN" ?
				null
			:	await getManagedOrganizationIds(session);

		const [total, active, byRole] = await Promise.all([
			db.user.count({
				where:
					managedOrganizationIds === null ?
						{}
					:	{ organizationId: { in: managedOrganizationIds } },
			}),
			db.user.count({
				where:
					managedOrganizationIds === null ?
						{ isActive: true }
					:	{
							organizationId: { in: managedOrganizationIds },
							isActive: true,
						},
			}),
			db.user.groupBy({
				by: ["role"],
				where:
					managedOrganizationIds === null ?
						{}
					:	{ organizationId: { in: managedOrganizationIds } },
				_count: true,
			}),
		]);

		const roleStats = byRole.reduce(
			(acc, item) => {
				acc[item.role] = item._count;
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			success: true,
			message: "User statistics retrieved successfully",
			data: {
				total,
				active,
				inactive: total - active,
				byRole: roleStats,
			},
		};
	} catch (error) {
		console.error("Failed to get user stats:", error);
		return {
			success: false,
			message: "Failed to retrieve user statistics",
		};
	}
}
