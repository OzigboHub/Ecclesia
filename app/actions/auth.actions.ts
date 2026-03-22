"use server";

import { signIn, signOut } from "@/auth";
import db from "@/lib/db";
import {
	loginSchema,
	registerSchemaServer,
	resetPasswordSchema,
} from "@/lib/validators/auth.schema";
import type { ActionResponse } from "@/types";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

/**
 * Login action - authenticates user with email and password
 */
export async function login(data: {
	email: string;
	password: string;
}): Promise<ActionResponse> {
	try {
		// Validate input
		const parsed = loginSchema.safeParse(data);
		if (!parsed.success) {
			return {
				success: false,
				message: "Invalid email or password format",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const result = await signIn("credentials", {
			email: parsed.data.email,
			password: parsed.data.password,
			redirect: false,
		});

		if (!result || result.error) {
			return {
				success: false,
				message: "Invalid email or password",
			};
		}

		return { success: true, message: "Login successful" };
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					return {
						success: false,
						message: "Invalid email or password",
					};
				case "AccessDenied":
					return {
						success: false,
						message: "Access denied. Your account may be inactive.",
					};
				default:
					return { success: false, message: "Authentication failed" };
			}
		}
		console.error("Login error:", error);
		return { success: false, message: "An unexpected error occurred" };
	}
}

/**
 * Logout action - signs out the current user
 */
export async function logout(): Promise<ActionResponse> {
	try {
		await signOut({ redirect: false });
		redirect("/auth/login");
	} catch (error) {
		console.error("Logout error:", error);
		return { success: false, message: "Failed to logout" };
	}
}

/**
 * Register action - creates a new user account
 */
export async function register(data: {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	dateOfBirth: string;
	address?: string;
	password: string;
	confirmPassword: string;
	organizationId: string;
	role?: string;
}): Promise<ActionResponse> {
	try {
		// Validate input
		const parsed = registerSchemaServer.safeParse(data);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Check if user already exists
		const existingUser = await db.user.findUnique({
			where: { email: parsed.data.email },
		});

		if (existingUser) {
			return {
				success: false,
				message: "A user with this email already exists",
			};
		}

		// Verify organization exists
		const organization = await db.organization.findUnique({
			where: { id: parsed.data.organizationId },
		});

		if (!organization) {
			return { success: false, message: "Invalid organization" };
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

		// Create user
		const user = await db.user.create({
			data: {
				firstName: parsed.data.firstName,
				lastName: parsed.data.lastName,
				email: parsed.data.email,
				phone: parsed.data.phone,
				address: parsed.data.address || null,
				dateOfBirth: new Date(parsed.data.dateOfBirth),
				password: hashedPassword,
				organizationId: parsed.data.organizationId,
				role:
					(parsed.data.role as unknown as UserRole) || "PARISHIONER",
				isActive: true,
			},
		});

		return {
			success: true,
			message: "Account created successfully. Please log in.",
			data: { id: user.id },
		};
	} catch (error) {
		console.error("Registration error:", error);
		return { success: false, message: "Failed to create account" };
	}
}

/**
 * Get organizations for registration dropdown
 */
export async function getOrganizations(): Promise<
	ActionResponse<{ id: string; name: string; level: string }[]>
> {
	try {
		const organizations = await db.organization.findMany({
			select: {
				id: true,
				name: true,
				level: true,
			},
			orderBy: [{ level: "asc" }, { name: "asc" }],
		});

		return {
			success: true,
			message: "Organizations retrieved successfully",
			data: organizations,
		};
	} catch (error) {
		console.error("Get organizations error:", error);
		return { success: false, message: "Failed to fetch organizations" };
	}
}

/**
 * Request password reset - generates a reset token and sends email
 */
export async function requestPasswordReset(
	email: string,
): Promise<ActionResponse> {
	try {
		// Find user by email
		const user = await db.user.findUnique({
			where: { email: email.toLowerCase().trim() },
		});

		// Always return success for security (don't reveal if email exists)
		if (!user) {
			return {
				success: true,
				message: "If an account exists, a reset link will be sent",
			};
		}

		// Delete any existing reset tokens for this user
		await db.passwordResetToken.deleteMany({
			where: { userId: user.id },
		});

		// Generate reset token
		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		// Create password reset token
		await db.passwordResetToken.create({
			data: {
				token,
				userId: user.id,
				expiresAt,
			},
		});

		// TODO: Send email with reset link
		// For now, log the token for development
		const resetUrl = `${
			process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
		}/auth/reset-password?token=${token}`;

		// In production, you would send an email here:
		// await sendPasswordResetEmail(user.email, resetUrl);

		return {
			success: true,
			message: "If an account exists, a reset link will be sent",
		};
	} catch (error) {
		console.error("Password reset request error:", error);
		return { success: false, message: "Failed to process request" };
	}
}

/**
 * Validate password reset token
 */
export async function validateResetToken(
	token: string,
): Promise<ActionResponse> {
	try {
		const resetToken = await db.passwordResetToken.findUnique({
			where: { token },
		});

		if (!resetToken) {
			return { success: false, message: "Invalid reset token" };
		}

		if (resetToken.usedAt) {
			return { success: false, message: "Token has already been used" };
		}

		if (resetToken.expiresAt < new Date()) {
			return { success: false, message: "Token has expired" };
		}

		return { success: true, message: "Token is valid" };
	} catch (error) {
		console.error("Token validation error:", error);
		return { success: false, message: "Failed to validate token" };
	}
}

/**
 * Reset password using token
 */
export async function resetPassword(data: {
	token: string;
	password: string;
	confirmPassword: string;
}): Promise<ActionResponse> {
	try {
		// Validate input
		const parsed = resetPasswordSchema.safeParse(data);
		if (!parsed.success) {
			return {
				success: false,
				message: "Invalid input",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Find and validate token
		const resetToken = await db.passwordResetToken.findUnique({
			where: { token: parsed.data.token },
			include: { user: true },
		});

		if (!resetToken) {
			return { success: false, message: "Invalid reset token" };
		}

		if (resetToken.usedAt) {
			return { success: false, message: "Token has already been used" };
		}

		if (resetToken.expiresAt < new Date()) {
			return { success: false, message: "Token has expired" };
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

		// Update user password and mark token as used
		await db.$transaction([
			db.user.update({
				where: { id: resetToken.userId },
				data: { password: hashedPassword },
			}),
			db.passwordResetToken.update({
				where: { id: resetToken.id },
				data: { usedAt: new Date() },
			}),
		]);

		return { success: true, message: "Password reset successfully" };
	} catch (error) {
		console.error("Password reset error:", error);
		return { success: false, message: "Failed to reset password" };
	}
}
