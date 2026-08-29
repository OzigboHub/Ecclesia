"use server";

import { configureOutstationPaystackProfile } from "@/app/actions/paystack.actions";
import { auth } from "@/auth";
import db from "@/lib/db";
import type { FeatureName } from "@/lib/features";
import { featureDependencies } from "@/lib/features";
import { isFeatureEnabled } from "@/lib/features.server";
import { renderBrandedEmailTemplate } from "@/lib/notifications/email-template";
import { canEditOrganizationProfile } from "@/lib/permissions";
import type { ActionResponse } from "@/types";
import {
	HierarchyLevel,
	type OrganizationFeatureSettings,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

/**
 * Get public information about an organization
 */
export async function getPublicOrganization(
	id: string,
): Promise<ActionResponse<any>> {
	try {
		const organization = await db.organization.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				address: true,
				contactEmail: true,
				contactPhone: true,
				level: true,
			},
		});

		if (!organization) {
			return { success: false, message: "Organization not found" };
		}

		return {
			success: true,
			message: "Organization retrieved",
			data: organization,
		};
	} catch (error) {
		console.error("Get public organization error:", error);
		return { success: false, message: "Failed to fetch organization" };
	}
}

/**
 * Get organization feature settings for the current user's organization
 */
export async function getOrganizationFeatures(
	targetOrganizationId?: string,
): Promise<ActionResponse<OrganizationFeatureSettings>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		let organizationId = session.user.organizationId;

		// Super admin override
		if (targetOrganizationId && session.user.role === "SUPER_ADMIN") {
			organizationId = targetOrganizationId;
		}

		if (!organizationId) {
			return { success: false, message: "No organization context" };
		}

		let settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId },
		});

		// Create default settings if they don't exist
		if (!settings) {
			settings = await db.organizationFeatureSettings.create({
				data: { organizationId },
			});
		}

		return {
			success: true,
			message: "Feature settings retrieved",
			data: settings,
		};
	} catch (error) {
		console.error("Get organization features error:", error);
		return { success: false, message: "Failed to fetch feature settings" };
	}
}

/**
 * Update organization feature settings (Admin only)
 */
/**
 * Update organization feature settings (Admin only)
 * or a specific organization if the user is a super admin
 */
export async function updateOrganizationFeatures(
	updates: Partial<Record<FeatureName, boolean>>,
	targetOrganizationId?: string,
): Promise<ActionResponse<OrganizationFeatureSettings>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		let organizationId = session.user.organizationId;

		// Super admin override
		if (targetOrganizationId && session.user.role === "SUPER_ADMIN") {
			organizationId = targetOrganizationId;
		}

		if (!organizationId) {
			return { success: false, message: "No organization context" };
		}

		// Only Super Admin / System Admin can update feature settings
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message:
					"You do not have permission to update feature settings",
			};
		}

		// Validate feature dependencies
		for (const [feature, enabled] of Object.entries(updates)) {
			if (enabled) {
				const dependencies =
					featureDependencies[feature as FeatureName] || [];
				for (const dep of dependencies) {
					// Check if dependency is being enabled in this update or already enabled
					const depEnabled =
						updates[dep] ??
						(await isFeatureEnabled(organizationId, dep));
					if (!depEnabled) {
						return {
							success: false,
							message: `Cannot enable ${feature} without enabling ${dep} first`,
						};
					}
				}
			}
		}

		// Ensure settings exist
		await db.organizationFeatureSettings.upsert({
			where: { organizationId },
			create: { organizationId },
			update: {},
		});

		// Update settings
		const settings = await db.organizationFeatureSettings.update({
			where: { organizationId },
			data: updates,
		});

		return {
			success: true,
			message: "Feature settings updated successfully",
			data: settings,
		};
	} catch (error) {
		console.error("Update organization features error:", error);
		return { success: false, message: "Failed to update feature settings" };
	}
}

/**
 * Toggle a single feature (Admin only)
 */
export async function toggleFeature(
	feature: FeatureName,
	enabled: boolean,
	targetOrganizationId?: string,
): Promise<ActionResponse<OrganizationFeatureSettings>> {
	return updateOrganizationFeatures(
		{ [feature]: enabled },
		targetOrganizationId,
	);
}

/**
 * Get current organization details
 */
export async function getCurrentOrganization(): Promise<
	ActionResponse<{
		id: string;
		name: string;
		level: string;
		address: string | null;
		phone: string | null;
		email: string | null;
	}>
> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: "Unauthorized" };
		}

		const organization = await db.organization.findUnique({
			where: { id: session.user.organizationId },
			select: {
				id: true,
				name: true,
				level: true,
				address: true,
				contactEmail: true,
				contactPhone: true,
			},
		});

		if (!organization) {
			return { success: false, message: "Organization not found" };
		}

		return {
			success: true,
			message: "Organization retrieved",
			data: {
				id: organization.id,
				name: organization.name,
				level: organization.level,
				address: organization.address,
				phone: organization.contactPhone,
				email: organization.contactEmail,
			},
		};
	} catch (error) {
		console.error("Get current organization error:", error);
		return { success: false, message: "Failed to fetch organization" };
	}
}

export async function getOutstationsForCurrentParish(): Promise<
	ActionResponse<Array<{ id: string; name: string }>>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (
			session.user.role !== "PARISH_ADMIN" &&
			session.user.role !== "SUPER_ADMIN"
		) {
			return { success: false, message: "Permission denied" };
		}

		const where =
			session.user.role === "SUPER_ADMIN" ?
				{ level: HierarchyLevel.OUTSTATION }
			:	{
					level: HierarchyLevel.OUTSTATION,
					parentId: session.user.organizationId,
				};

		const outstations = await db.organization.findMany({
			where,
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		});

		return {
			success: true,
			message: "Outstations retrieved",
			data: outstations,
		};
	} catch (error) {
		console.error("Failed to get outstations:", error);
		return { success: false, message: "Failed to fetch outstations" };
	}
}

/**
 * Update organization details (Admin only)
 */
export async function updateOrganization(data: {
	name?: string;
	address?: string;
	phone?: string;
	email?: string;
}): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: "Unauthorized" };
		}

		// Only Super Admin / System Admin can update organization details (Settings)
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message:
					"You do not have permission to update organization details",
			};
		}

		// Map to actual database field names
		const updateData: Record<string, string | undefined> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.address !== undefined) updateData.address = data.address;
		if (data.phone !== undefined) updateData.contactPhone = data.phone;
		if (data.email !== undefined) updateData.contactEmail = data.email;

		await db.organization.update({
			where: { id: session.user.organizationId },
			data: updateData,
		});

		return {
			success: true,
			message: "Organization updated successfully",
		};
	} catch (error) {
		console.error("Update organization error:", error);
		return { success: false, message: "Failed to update organization" };
	}
}

/**
 * Update organization profile for parish/outstation admins
 */
export async function updateOrganizationProfileAction(
	data: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canEditOrganizationProfile(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const { updateOrganizationSchema } =
			await import("@/lib/validators/organization.schema");
		const parsed = updateOrganizationSchema.safeParse(data);

		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const organization = await db.organization.findUnique({
			where: { id: session.user.organizationId },
			select: {
				id: true,
				name: true,
				level: true,
				address: true,
				contactEmail: true,
				contactPhone: true,
			},
		});

		if (!organization) {
			return { success: false, message: "Organization not found" };
		}

		if (
			session.user.role === "OUTSTATION_ADMIN" &&
			organization.level !== "OUTSTATION"
		) {
			return { success: false, message: "Permission denied" };
		}

		if (
			session.user.role === "PARISH_ADMIN" &&
			organization.level !== "PARISH"
		) {
			return { success: false, message: "Permission denied" };
		}

		const updateData: Record<string, string | undefined> = {};
		if (
			session.user.role !== "OUTSTATION_ADMIN" &&
			parsed.data.name !== undefined
		) {
			updateData.name = parsed.data.name;
		}
		if (parsed.data.address !== undefined) {
			updateData.address = parsed.data.address;
		}
		if (parsed.data.contactEmail !== undefined) {
			updateData.contactEmail = parsed.data.contactEmail;
		}
		if (parsed.data.contactPhone !== undefined) {
			updateData.contactPhone = parsed.data.contactPhone;
		}

		if (Object.keys(updateData).length === 0) {
			return {
				success: false,
				message: "No changes to update",
			};
		}

		if (updateData.name && updateData.name !== organization.name) {
			const existing = await db.organization.findUnique({
				where: { name: updateData.name },
				select: { id: true },
			});

			if (existing && existing.id !== organization.id) {
				return {
					success: false,
					message: "Organization with this name already exists",
				};
			}
		}

		await db.organization.update({
			where: { id: session.user.organizationId },
			data: updateData,
		});

		await db.auditLog.create({
			data: {
				action: "UPDATE",
				entityType: "Organization",
				entityId: organization.id,
				performedBy: session.user.id,
				details: {
					previous: {
						name: organization.name,
						address: organization.address,
						contactEmail: organization.contactEmail,
						contactPhone: organization.contactPhone,
					},
					next: updateData,
				},
			},
		});

		return {
			success: true,
			message: "Organization profile updated successfully",
		};
	} catch (error) {
		console.error("Update organization profile error:", error);
		return {
			success: false,
			message: "Failed to update organization profile",
		};
	}
}

// ============================================
// ORGANIZATION PAGINATION HELPERS
// ============================================

/**
 * Get paginated users for an organization
 */
export async function getOrganizationUsers(
	organizationId: string,
	limit: number = 20,
	offset: number = 0,
): Promise<ActionResponse<{ users: any[]; total: number }>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only super admins or users from the same organization
		if (
			session.user.role !== "SUPER_ADMIN" &&
			session.user.organizationId !== organizationId
		) {
			return { success: false, message: "Unauthorized" };
		}

		const [users, total] = await Promise.all([
			db.user.findMany({
				where: { organizationId },
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
			}),
			db.user.count({ where: { organizationId } }),
		]);

		return {
			success: true,
			message: "Users retrieved",
			data: { users, total },
		};
	} catch (error) {
		console.error("Get organization users error:", error);
		return { success: false, message: "Failed to fetch users" };
	}
}

/**
 * Get paginated parishioners for an organization
 */
export async function getOrganizationParishioners(
	organizationId: string,
	limit: number = 20,
	offset: number = 0,
): Promise<ActionResponse<{ parishioners: any[]; total: number }>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only super admins or users from the same organization
		if (
			session.user.role !== "SUPER_ADMIN" &&
			session.user.organizationId !== organizationId
		) {
			return { success: false, message: "Unauthorized" };
		}

		const [parishioners, total] = await Promise.all([
			db.parishioner.findMany({
				where: { organizationId },
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
			}),
			db.parishioner.count({ where: { organizationId } }),
		]);

		return {
			success: true,
			message: "Parishioners retrieved",
			data: { parishioners, total },
		};
	} catch (error) {
		console.error("Get organization parishioners error:", error);
		return { success: false, message: "Failed to fetch parishioners" };
	}
}

/**
 * Get paginated societies for an organization
 */
export async function getOrganizationSocieties(
	organizationId: string,
	limit: number = 20,
	offset: number = 0,
): Promise<ActionResponse<{ societies: any[]; total: number }>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only super admins or users from the same organization
		if (
			session.user.role !== "SUPER_ADMIN" &&
			session.user.organizationId !== organizationId
		) {
			return { success: false, message: "Unauthorized" };
		}

		const [societies, total] = await Promise.all([
			db.society.findMany({
				where: { organizationId },
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
			}),
			db.society.count({ where: { organizationId } }),
		]);

		return {
			success: true,
			message: "Societies retrieved",
			data: { societies, total },
		};
	} catch (error) {
		console.error("Get organization societies error:", error);
		return { success: false, message: "Failed to fetch societies" };
	}
}

// ============================================
// SUPER ADMIN ORGANIZATION MANAGEMENT
// ============================================

/**
 * Get all organizations (parishes and outstations) - SUPER_ADMIN only
 */
export async function getAllOrganizations(): Promise<
	ActionResponse<
		Array<{
			id: string;
			name: string;
			level: string;
			parentId: string | null;
			address: string | null;
			createdAt: Date;
			userCount: number;
		}>
	>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only SUPER_ADMIN can view all organizations
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message: "Only super admins can view all organizations",
			};
		}

		const organizations = await db.organization.findMany({
			select: {
				id: true,
				name: true,
				level: true,
				parentId: true,
				address: true,
				createdAt: true,
				_count: {
					select: { users: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Transform the data
		const transformed = organizations.map((org) => ({
			id: org.id,
			name: org.name,
			level: org.level,
			parentId: org.parentId,
			address: org.address,
			createdAt: org.createdAt,
			userCount: org._count.users,
		}));

		return {
			success: true,
			message: "Organizations retrieved successfully",
			data: transformed,
		};
	} catch (error) {
		console.error("Failed to get all organizations:", error);
		return { success: false, message: "Failed to retrieve organizations" };
	}
}

/**
 * Create a new parish - SUPER_ADMIN only
 */
export async function createParish(
	data: unknown,
): Promise<ActionResponse<{ id: string; name: string }>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only SUPER_ADMIN can create parishes
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message: "Only super admins can create parishes",
			};
		}

		// Import and validate
		const { createParishSchema } =
			await import("@/lib/validators/organization.schema");
		const parsed = createParishSchema.safeParse(data);

		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Check if name already exists
		const existing = await db.organization.findUnique({
			where: { name: parsed.data.name },
		});

		if (existing) {
			return {
				success: false,
				message: "Organization with this name already exists",
			};
		}

		const { parishAdmin } = parsed.data;

		// Check if parish admin email already exists
		const existingAdmin = await db.user.findUnique({
			where: { email: parishAdmin.email },
		});
		if (existingAdmin) {
			return {
				success: false,
				message: "A user with this parish admin email already exists",
				errors: {
					"parishAdmin.email": ["This email is already registered"],
				},
			};
		}

		const hasManualPassword = Boolean(
			parishAdmin.password && parishAdmin.password.trim(),
		);
		const plainPassword =
			hasManualPassword ?
				parishAdmin.password!
			:	crypto.randomBytes(32).toString("hex");
		const hashedPassword = await bcrypt.hash(plainPassword, 12);

		// Create parish and parish admin in a transaction
		const { newParish, newAdmin } = await db.$transaction(async (tx) => {
			const createdParish = await tx.organization.create({
				data: {
					name: parsed.data.name,
					level: "PARISH",
					address: parsed.data.address,
					contactEmail: parsed.data.contactEmail,
					contactPhone: parsed.data.contactPhone,
				},
			});

			const createdAdmin = await tx.user.create({
				data: {
					firstName: parishAdmin.firstName,
					lastName: parishAdmin.lastName,
					email: parishAdmin.email,
					password: hashedPassword,
					role: "PARISH_ADMIN",
					organizationId: createdParish.id,
					isActive: true,
				},
			});

			return { newParish: createdParish, newAdmin: createdAdmin };
		});

		if (!hasManualPassword) {
			await sendAdminWelcomeInvitation({
				email: parishAdmin.email,
				firstName: parishAdmin.firstName,
				organizationName: newParish.name,
				roleTitle: "Parish Administrator",
				userId: newAdmin.id,
			});
		}

		return {
			success: true,
			message:
				hasManualPassword ?
					"Parish created successfully with parish admin"
				:	"Parish created successfully. An invitation email with password setup instructions has been sent to the parish admin.",
			data: { id: newParish.id, name: newParish.name },
		};
	} catch (error) {
		console.error("Failed to create parish:", error);
		return { success: false, message: "Failed to create parish" };
	}
}

/**
 * Send an email invitation with password reset / setup link to a newly onboarded admin
 */
async function sendAdminWelcomeInvitation(params: {
	email: string;
	firstName: string;
	organizationName: string;
	roleTitle: string;
	userId: string;
}) {
	try {
		// Delete any existing reset tokens for this user
		await db.passwordResetToken.deleteMany({
			where: { userId: params.userId },
		});

		// Generate reset token (expires in 48 hours for onboarding)
		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

		await db.passwordResetToken.create({
			data: {
				token,
				userId: params.userId,
				expiresAt,
			},
		});

		if (process.env.RESEND_API_KEY) {
			const resend = new Resend(process.env.RESEND_API_KEY);
			const fromName = process.env.RESEND_FROM_NAME?.trim() || "Ecclesia";
			const fromAddress = "support@ecclesialight.com";
			const html = renderBrandedEmailTemplate({
				title: `Welcome to Ecclesia, ${params.firstName}!`,
				message: `You have been appointed as the ${params.roleTitle} for ${params.organizationName}. Click the button below to set up your account password and access your parish portal.`,
				ctaLabel: "Set Up Your Password",
				ctaUrl: `/auth/reset-password?token=${token}`,
				footerNote:
					"This invitation link expires in 48 hours. You can also use 'Forgot Password' on the login page anytime with your registered email.",
			});

			await resend.emails.send({
				from: `${fromName} <${fromAddress}>`,
				to: params.email,
				subject: `Set up your ${params.roleTitle} account for ${params.organizationName}`,
				html,
			});
		}
	} catch (error) {
		console.error("Failed to send admin welcome invitation email:", error);
	}
}

/**
 * Create a new outstation under a parish - SUPER_ADMIN or PARISH_ADMIN
 */
export async function createOutstation(
	data: unknown,
): Promise<ActionResponse<{ id: string; name: string }>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const isSuperAdmin = session.user.role === "SUPER_ADMIN";
		const isParishAdmin = session.user.role === "PARISH_ADMIN";
		if (!isSuperAdmin && !isParishAdmin) {
			return {
				success: false,
				message: "Only admins can create outstations",
			};
		}

		// Import and validate
		const { createOutstationSchema } =
			await import("@/lib/validators/organization.schema");
		const parsed = createOutstationSchema.safeParse(data);

		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		if (
			isParishAdmin &&
			session.user.organizationId !== parsed.data.parentId
		) {
			return {
				success: false,
				message: "You can only create outstations for your parish",
			};
		}

		// Verify parent is a parish
		const parent = await db.organization.findFirst({
			where: {
				id: parsed.data.parentId,
				level: "PARISH",
			},
		});

		if (!parent) {
			return {
				success: false,
				message: "Invalid parish selected. Parent must be a parish.",
			};
		}

		// Check if name already exists
		const existing = await db.organization.findUnique({
			where: { name: parsed.data.name },
		});

		if (existing) {
			return {
				success: false,
				message: "Organization with this name already exists",
			};
		}

		const { outstationAdmin } = parsed.data;

		const existingAdmin = await db.user.findUnique({
			where: { email: outstationAdmin.email },
		});
		if (existingAdmin) {
			return {
				success: false,
				message:
					"A user with this outstation admin email already exists",
				errors: {
					"outstationAdmin.email": [
						"This email is already registered",
					],
				},
			};
		}

		const hasManualPassword = Boolean(
			outstationAdmin.password && outstationAdmin.password.trim(),
		);
		const plainPassword =
			hasManualPassword ?
				outstationAdmin.password!
			:	crypto.randomBytes(32).toString("hex");
		const hashedPassword = await bcrypt.hash(plainPassword, 12);

		const { outstation, newAdmin } = await db.$transaction(async (tx) => {
			const newOutstation = await tx.organization.create({
				data: {
					name: parsed.data.name,
					level: "OUTSTATION",
					parentId: parsed.data.parentId,
					address: parsed.data.address,
					contactEmail: parsed.data.contactEmail,
					contactPhone: parsed.data.contactPhone,
				},
			});

			await tx.organizationFeatureSettings.create({
				data: {
					organizationId: newOutstation.id,
					enableParishionerManagement: true,
				},
			});

			const createdAdmin = await tx.user.create({
				data: {
					firstName: outstationAdmin.firstName,
					lastName: outstationAdmin.lastName,
					email: outstationAdmin.email,
					password: hashedPassword,
					role: "OUTSTATION_ADMIN",
					organizationId: newOutstation.id,
					isActive: true,
				},
			});

			return { outstation: newOutstation, newAdmin: createdAdmin };
		});

		if (!hasManualPassword) {
			await sendAdminWelcomeInvitation({
				email: outstationAdmin.email,
				firstName: outstationAdmin.firstName,
				organizationName: outstation.name,
				roleTitle: "Outstation Administrator",
				userId: newAdmin.id,
			});
		}

		const paystackResult = await configureOutstationPaystackProfile(
			parsed.data.paystackProfile,
			outstation.id,
		);

		if (!paystackResult.success) {
			return {
				success: false,
				message: `Outstation created, but Paystack setup failed: ${paystackResult.message}`,
				data: { id: outstation.id, name: outstation.name },
				errors: paystackResult.errors,
			};
		}

		return {
			success: true,
			message:
				hasManualPassword ?
					"Outstation created with Paystack subaccount"
				:	"Outstation created with Paystack subaccount. An invitation email with password setup instructions has been sent to the outstation admin.",
			data: { id: outstation.id, name: outstation.name },
		};
	} catch (error) {
		console.error("Failed to create outstation:", error);
		return { success: false, message: "Failed to create outstation" };
	}
}

/**
 * Update organization details - SUPER_ADMIN only
 */
export async function updateOrganizationAdminAction(
	organizationId: string,
	data: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only SUPER_ADMIN can update organizations
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message: "Only super admins can update organizations",
			};
		}

		// Import and validate
		const { updateOrganizationSchema } =
			await import("@/lib/validators/organization.schema");
		const parsed = updateOrganizationSchema.safeParse(data);

		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify organization exists
		const org = await db.organization.findUnique({
			where: { id: organizationId },
		});

		if (!org) {
			return { success: false, message: "Organization not found" };
		}

		// Check name uniqueness if changing
		if (parsed.data.name && parsed.data.name !== org.name) {
			const existing = await db.organization.findUnique({
				where: { name: parsed.data.name },
			});

			if (existing) {
				return {
					success: false,
					message: "Organization with this name already exists",
				};
			}
		}

		// Prepare update data
		const updateData: Record<string, string | undefined> = {};
		if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
		if (parsed.data.address !== undefined)
			updateData.address = parsed.data.address;
		if (parsed.data.contactEmail !== undefined)
			updateData.contactEmail = parsed.data.contactEmail;
		if (parsed.data.contactPhone !== undefined)
			updateData.contactPhone = parsed.data.contactPhone;

		// Update
		await db.organization.update({
			where: { id: organizationId },
			data: updateData,
		});

		return {
			success: true,
			message: "Organization updated successfully",
		};
	} catch (error) {
		console.error("Failed to update organization:", error);
		return { success: false, message: "Failed to update organization" };
	}
}

/**
 * Delete (soft delete) an organization - SUPER_ADMIN only
 * Note: Check for dependent data before soft deleting
 */
export async function deleteOrganizationAdminAction(
	organizationId: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only SUPER_ADMIN can delete organizations
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message: "Only super admins can delete organizations",
			};
		}

		// Verify organization exists
		const org = await db.organization.findUnique({
			where: { id: organizationId },
			include: {
				children: true,
				users: true,
				parishioners: true,
			},
		});

		if (!org) {
			return { success: false, message: "Organization not found" };
		}

		// Prevent deletion of parish with outstations
		if (org.level === "PARISH" && org.children.length > 0) {
			return {
				success: false,
				message: `Cannot delete parish with ${org.children.length} outstation(s). Transfer or delete outstations first.`,
			};
		}

		// Prevent deletion of organization with users
		if (org.users.length > 0) {
			return {
				success: false,
				message: `Cannot delete organization with ${org.users.length} user(s). Reassign or deactivate users first.`,
			};
		}

		// Prevent deletion of organization with parishioners
		if (org.parishioners.length > 0) {
			return {
				success: false,
				message: `Cannot delete organization with ${org.parishioners.length} parishioner(s). Archive or reassign parishioners first.`,
			};
		}

		// Soft delete by marking as inactive (if your schema supports it)
		// For now, we'll do a hard delete since schema doesn't have isActive field
		await db.organization.delete({
			where: { id: organizationId },
		});

		return {
			success: true,
			message: "Organization deleted successfully",
		};
	} catch (error) {
		console.error("Failed to delete organization:", error);
		return { success: false, message: "Failed to delete organization" };
	}
}

/**
 * Transfer an outstation to a different parish - SUPER_ADMIN only
 */
export async function transferOutstationAdminAction(
	data: unknown,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only SUPER_ADMIN can transfer outstations
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message: "Only super admins can transfer outstations",
			};
		}

		// Import and validate
		const { transferOutstationSchema } =
			await import("@/lib/validators/organization.schema");
		const parsed = transferOutstationSchema.safeParse(data);

		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify outstation exists and is actually an outstation
		const outstation = await db.organization.findFirst({
			where: {
				id: parsed.data.outstationId,
				level: "OUTSTATION",
			},
		});

		if (!outstation) {
			return {
				success: false,
				message: "Outstation not found",
			};
		}

		// Verify new parent is a parish
		const newParent = await db.organization.findFirst({
			where: {
				id: parsed.data.newParentId,
				level: "PARISH",
			},
		});

		if (!newParent) {
			return {
				success: false,
				message: "Invalid parish selected for transfer",
			};
		}

		// Update parent
		await db.organization.update({
			where: { id: parsed.data.outstationId },
			data: { parentId: parsed.data.newParentId },
		});

		return {
			success: true,
			message: `Outstation transferred to ${newParent.name}`,
		};
	} catch (error) {
		console.error("Failed to transfer outstation:", error);
		return { success: false, message: "Failed to transfer outstation" };
	}
}

/**
 * Get system-wide metrics - SUPER_ADMIN only
 */
export async function getSystemMetrics(): Promise<
	ActionResponse<{
		totalParishes: number;
		totalOutstations: number;
		totalUsers: number;
		totalParishioners: number;
		totalPayments: number;
		totalPaymentAmount: number;
	}>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Only SUPER_ADMIN can view system metrics
		if (session.user.role !== "SUPER_ADMIN") {
			return {
				success: false,
				message: "Only super admins can view system metrics",
			};
		}

		const [
			totalParishes,
			totalOutstations,
			totalUsers,
			totalParishioners,
			totalPayments,
			paymentStats,
		] = await Promise.all([
			db.organization.count({ where: { level: "PARISH" } }),
			db.organization.count({ where: { level: "OUTSTATION" } }),
			db.user.count(),
			db.parishioner.count(),
			db.payment.count(),
			db.payment.aggregate({
				_sum: { amount: true },
				where: { paymentStatus: "COMPLETED" },
			}),
		]);

		return {
			success: true,
			message: "System metrics retrieved",
			data: {
				totalParishes,
				totalOutstations,
				totalUsers,
				totalParishioners,
				totalPayments,
				totalPaymentAmount: paymentStats._sum.amount ?? 0,
			},
		};
	} catch (error) {
		console.error("Failed to get system metrics:", error);
		return { success: false, message: "Failed to retrieve metrics" };
	}
}

/**
 * Get user's organization and child organizations (outstations)
 * Used for organization selector in calendar and mass creation
 */
export async function getUserOrganizationHierarchy(): Promise<
	ActionResponse<{
		myOrganization: { id: string; name: string; level: string };
		outstations: { id: string; name: string; level: string }[];
	}>
> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: "Unauthorized" };
		}

		const org = await db.organization.findUnique({
			where: { id: session.user.organizationId },
			select: {
				id: true,
				name: true,
				level: true,
				children: {
					select: { id: true, name: true, level: true },
					orderBy: { name: "asc" },
				},
			},
		});

		if (!org) {
			return { success: false, message: "Organization not found" };
		}

		return {
			success: true,
			message: "Organization hierarchy retrieved",
			data: {
				myOrganization: {
					id: org.id,
					name: org.name,
					level: org.level,
				},
				outstations: org.children,
			},
		};
	} catch (error) {
		console.error("Failed to get organization hierarchy:", error);
		return {
			success: false,
			message: "Failed to retrieve organization hierarchy",
		};
	}
}
