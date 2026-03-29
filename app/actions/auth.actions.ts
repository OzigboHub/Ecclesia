"use server";

import { auth, signIn, signOut } from "@/auth";
import db from "@/lib/db";
import {
	loginSchema,
	registerSchemaServer,
	resetPasswordSchema,
} from "@/lib/validators/auth.schema";
import type { ActionResponse } from "@/types";
import type { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthError } from "next-auth";
import { Resend } from "resend";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function minutesUntil(date: Date): number {
	const diffMs = date.getTime() - Date.now();
	if (diffMs <= 0) return 0;
	return Math.ceil(diffMs / 60000);
}

async function getActionIpAddress(): Promise<string | null> {
	const requestHeaders = await headers();
	const forwardedFor = requestHeaders.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() ?? null;
	}
	return requestHeaders.get("x-real-ip");
}

async function logAuthAction(params: {
	action: "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE" | "PERMISSION_CHANGE";
	entityId: string;
	performedBy: string;
	details?: Prisma.InputJsonValue;
}) {
	try {
		await db.auditLog.create({
			data: {
				action: params.action,
				entityType: "Auth",
				entityId: params.entityId,
				performedBy: params.performedBy,
				ipAddress: await getActionIpAddress(),
				details: params.details,
			},
		});
	} catch (error) {
		console.error("Failed to write auth action log:", error);
	}
}

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

		const normalizedEmail = parsed.data.email.toLowerCase().trim();

		const user = await db.user.findUnique({
			where: { email: normalizedEmail },
			select: {
				id: true,
				isActive: true,
				lockedUntil: true,
			},
		});

		if (user && !user.isActive) {
			return {
				success: false,
				message: "Access denied. Your account is inactive.",
			};
		}

		if (user?.lockedUntil && user.lockedUntil > new Date()) {
			const remaining = minutesUntil(user.lockedUntil);
			return {
				success: false,
				message:
					remaining > 0 ?
						`Account temporarily locked. Try again in ${remaining} minute(s).`
					:	"Account temporarily locked. Try again shortly.",
			};
		}

		const result = await signIn("credentials", {
			email: normalizedEmail,
			password: parsed.data.password,
			redirect: false,
		});

		if (!result || result.error) {
			if (user) {
				const refreshed = await db.user.findUnique({
					where: { id: user.id },
					select: { lockedUntil: true },
				});
				if (
					refreshed?.lockedUntil &&
					refreshed.lockedUntil > new Date()
				) {
					const remaining = minutesUntil(refreshed.lockedUntil);
					return {
						success: false,
						message:
							remaining > 0 ?
								`Too many failed attempts. Try again in ${remaining} minute(s).`
							:	"Too many failed attempts. Try again shortly.",
					};
				}
			}
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
		const session = await auth();
		if (session?.user?.id) {
			if (session.user.sessionId) {
				await db.userSession.updateMany({
					where: {
						tokenId: session.user.sessionId,
						userId: session.user.id,
						revokedAt: null,
					},
					data: { revokedAt: new Date() },
				});
			}

			await logAuthAction({
				action: "LOGOUT",
				entityId: session.user.id,
				performedBy: session.user.id,
				details: { role: session.user.role },
			});
		}

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
			where: { email: parsed.data.email.toLowerCase().trim() },
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

		const userRole =
			(parsed.data.role as unknown as UserRole) || "PARISHIONER";

		// Use a transaction to create both User and Parishioner (for PARISHIONER role)
		const user = await db.$transaction(async (tx) => {
			const newUser = await tx.user.create({
				data: {
					firstName: parsed.data.firstName,
					lastName: parsed.data.lastName,
					email: parsed.data.email.toLowerCase().trim(),
					phone: parsed.data.phone,
					address: parsed.data.address || null,
					dateOfBirth: new Date(parsed.data.dateOfBirth),
					password: hashedPassword,
					organizationId: parsed.data.organizationId,
					role: userRole,
					isActive: true,
				},
			});

			// Auto-create a Parishioner record so the account is linked at login
			if (userRole === "PARISHIONER") {
				await tx.parishioner.create({
					data: {
						firstName: parsed.data.firstName,
						lastName: parsed.data.lastName,
						email: parsed.data.email.toLowerCase().trim(),
						phone: parsed.data.phone,
						address: parsed.data.address || null,
						dateOfBirth: new Date(parsed.data.dateOfBirth),
						organizationId: parsed.data.organizationId,
					},
				});
			}

			return newUser;
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

		const resetUrl = `${
			process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
		}/auth/reset-password?token=${token}`;

		// Send password reset email via Resend
		if (process.env.RESEND_API_KEY) {
			const resend = new Resend(process.env.RESEND_API_KEY);
			const { error } = await resend.emails.send({
				from: `Ecclesia <support@ecclesialight.com>`,
				to: user.email,
				subject: "Reset Your Password",
				html: `
					<div style="background:#f6f6f6;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
						<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
							<tr>
								<td align="center">
									<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:30px;">
										<tr>
											<td align="center" style="padding-bottom:20px;">
												<img src="https://www.ecclesialight.com/standalone-golden-yellow-logo-typography.png" alt="Ecclesia" width="120" style="display:block;" />
											</td>
										</tr>
										<tr>
											<td>
												<h2 style="margin:0 0 16px 0;color:#333;">Password Reset Request</h2>
												<p style="font-size:14px;color:#444;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
											</td>
										</tr>
										<tr>
											<td align="center" style="padding:24px 0;">
												<a href="${resetUrl}" style="display:inline-block;background:#c9a84c;color:#ffffff;font-size:16px;font-weight:bold;padding:12px 32px;border-radius:6px;text-decoration:none;">Reset Password</a>
											</td>
										</tr>
										<tr>
											<td style="font-size:13px;color:#888;line-height:1.6;">
												<p>This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
												<p style="margin-top:16px;">If the button doesn&rsquo;t work, copy and paste this URL into your browser:</p>
												<p style="word-break:break-all;color:#c9a84c;">${resetUrl}</p>
											</td>
										</tr>
									</table>
								</td>
							</tr>
						</table>
					</div>
				`,
			});
			if (error) {
				console.error("Failed to send password reset email:", error);
			}
		} else {
			console.warn("RESEND_API_KEY not configured — password reset email not sent");
		}

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
				data: {
					password: hashedPassword,
					sessionVersion: { increment: 1 },
					failedLoginAttempts: 0,
					lastFailedLoginAt: null,
					lockedUntil: null,
				},
			}),
			db.passwordResetToken.update({
				where: { id: resetToken.id },
				data: { usedAt: new Date() },
			}),
		]);

		await logAuthAction({
			action: "PASSWORD_CHANGE",
			entityId: resetToken.userId,
			performedBy: resetToken.userId,
			details: { source: "PASSWORD_RESET" },
		});

		return { success: true, message: "Password reset successfully" };
	} catch (error) {
		console.error("Password reset error:", error);
		return { success: false, message: "Failed to reset password" };
	}
}

/**
 * Revoke all active sessions for the currently authenticated user.
 */
export async function revokeMySessions(): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		await db.userSession.updateMany({
			where: {
				userId: session.user.id,
				revokedAt: null,
			},
			data: { revokedAt: new Date() },
		});

		await db.user.update({
			where: { id: session.user.id },
			data: { sessionVersion: { increment: 1 } },
		});

		await logAuthAction({
			action: "PERMISSION_CHANGE",
			entityId: session.user.id,
			performedBy: session.user.id,
			details: {
				type: "SESSION_REVOKE",
				target: "ALL_DEVICES",
			},
		});

		await signOut({ redirect: false });
		return {
			success: true,
			message: "All sessions revoked successfully. Please sign in again.",
		};
	} catch (error) {
		console.error("Revoke sessions error:", error);
		return { success: false, message: "Failed to revoke sessions" };
	}
}

export interface ActiveSession {
	id: string;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: Date;
	lastSeenAt: Date;
	expiresAt: Date;
	isCurrent: boolean;
}

/**
 * Get active sessions for the current user.
 */
export async function getMyActiveSessions(): Promise<
	ActionResponse<ActiveSession[]>
> {
	try {
		const session = await auth();
		if (!session?.user?.id || !session.user.sessionId) {
			return { success: false, message: "Unauthorized" };
		}

		const now = new Date();
		const sessions = await db.userSession.findMany({
			where: {
				userId: session.user.id,
				revokedAt: null,
				expiresAt: { gt: now },
			},
			orderBy: { lastSeenAt: "desc" },
		});

		return {
			success: true,
			message: "Active sessions retrieved",
			data: sessions.map((item) => ({
				id: item.tokenId,
				ipAddress: item.ipAddress,
				userAgent: item.userAgent,
				createdAt: item.createdAt,
				lastSeenAt: item.lastSeenAt,
				expiresAt: item.expiresAt,
				isCurrent: item.tokenId === session.user.sessionId,
			})),
		};
	} catch (error) {
		console.error("Get active sessions error:", error);
		return { success: false, message: "Failed to fetch active sessions" };
	}
}

/**
 * Revoke a specific active session for current user.
 */
export async function revokeMySession(
	sessionId: string,
): Promise<ActionResponse<{ revokedCurrent: boolean }>> {
	try {
		const session = await auth();
		if (!session?.user?.id || !session.user.sessionId) {
			return { success: false, message: "Unauthorized" };
		}

		const active = await db.userSession.findFirst({
			where: {
				tokenId: sessionId,
				userId: session.user.id,
				revokedAt: null,
				expiresAt: { gt: new Date() },
			},
			select: { tokenId: true },
		});

		if (!active) {
			return { success: false, message: "Session not found" };
		}

		await db.userSession.update({
			where: { tokenId: sessionId },
			data: { revokedAt: new Date() },
		});

		await logAuthAction({
			action: "PERMISSION_CHANGE",
			entityId: session.user.id,
			performedBy: session.user.id,
			details: {
				type: "SESSION_REVOKE",
				target: "SINGLE_SESSION",
				sessionId,
			},
		});

		return {
			success: true,
			message: "Session revoked successfully",
			data: { revokedCurrent: sessionId === session.user.sessionId },
		};
	} catch (error) {
		console.error("Revoke session error:", error);
		return { success: false, message: "Failed to revoke session" };
	}
}
