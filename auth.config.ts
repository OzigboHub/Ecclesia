import db from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth.schema";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

function getClientIp(request?: Request): string | null {
	if (!request) return null;
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() ?? null;
	}
	return request.headers.get("x-real-ip");
}

async function logAuthEvent(params: {
	action: "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE" | "PERMISSION_CHANGE";
	entityId: string;
	performedBy: string;
	ipAddress?: string | null;
	details?: Prisma.InputJsonValue;
}) {
	try {
		await db.auditLog.create({
			data: {
				action: params.action,
				entityType: "Auth",
				entityId: params.entityId,
				performedBy: params.performedBy,
				ipAddress: params.ipAddress ?? null,
				details: params.details,
			},
		});
	} catch (error) {
		console.error("Failed to create auth audit log:", error);
	}
}

async function handleFailedLogin(params: {
	userId?: string;
	email: string;
	ipAddress?: string | null;
	reason: "INVALID_CREDENTIALS" | "INACTIVE_ACCOUNT" | "ACCOUNT_LOCKED";
	currentAttempts?: number;
}) {
	if (params.userId) {
		if (params.reason === "ACCOUNT_LOCKED") {
			await logAuthEvent({
				action: "LOGIN",
				entityId: params.userId,
				performedBy: params.userId,
				ipAddress: params.ipAddress,
				details: {
					status: "FAILED",
					reason: params.reason,
					email: params.email,
					failedLoginAttempts: params.currentAttempts ?? 0,
				},
			});
			return;
		}

		const attempts = (params.currentAttempts ?? 0) + 1;
		const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
		const lockedUntil =
			shouldLock ?
				new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
			:	null;

		await db.user.update({
			where: { id: params.userId },
			data: {
				failedLoginAttempts: attempts,
				lastFailedLoginAt: new Date(),
				lockedUntil,
			},
		});

		await logAuthEvent({
			action: "LOGIN",
			entityId: params.userId,
			performedBy: params.userId,
			ipAddress: params.ipAddress,
			details: {
				status: "FAILED",
				reason: params.reason,
				email: params.email,
				failedLoginAttempts: attempts,
				lockedUntil: lockedUntil?.toISOString() ?? null,
			},
		});
		return;
	}

	await logAuthEvent({
		action: "LOGIN",
		entityId: params.email,
		performedBy: "SYSTEM",
		ipAddress: params.ipAddress,
		details: {
			status: "FAILED",
			reason: params.reason,
			email: params.email,
		},
	});
}

export const authConfig: NextAuthConfig = {
	providers: [
		Credentials({
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials, request) {
				try {
					// Validate credentials with Zod
					const { email, password } =
						await loginSchema.parseAsync(credentials);
					const normalizedEmail = email.toLowerCase().trim();
					const ipAddress = getClientIp(request);
					const userAgent =
						request?.headers.get("user-agent") ?? null;

					// Find user by email
					const user = await db.user.findUnique({
						where: { email: normalizedEmail },
						include: { organization: true },
					});

					// Check if user exists and has a password
					if (!user || !user.password) {
						await handleFailedLogin({
							email: normalizedEmail,
							ipAddress,
							reason: "INVALID_CREDENTIALS",
						});
						return null;
					}

					// Check if account is active
					if (!user.isActive) {
						await handleFailedLogin({
							userId: user.id,
							email: normalizedEmail,
							ipAddress,
							reason: "INACTIVE_ACCOUNT",
						});
						return null;
					}

					if (user.lockedUntil && user.lockedUntil > new Date()) {
						await handleFailedLogin({
							userId: user.id,
							email: normalizedEmail,
							ipAddress,
							reason: "ACCOUNT_LOCKED",
							currentAttempts: user.failedLoginAttempts,
						});
						return null;
					}

					// Verify password
					const isValid = await bcrypt.compare(
						password,
						user.password,
					);

					if (!isValid) {
						await handleFailedLogin({
							userId: user.id,
							email: normalizedEmail,
							ipAddress,
							reason: "INVALID_CREDENTIALS",
							currentAttempts: user.failedLoginAttempts,
						});
						return null;
					}

					// Update last login timestamp
					await db.user.update({
						where: { id: user.id },
						data: {
							lastLogin: new Date(),
							failedLoginAttempts: 0,
							lastFailedLoginAt: null,
							lockedUntil: null,
						},
					});

					await logAuthEvent({
						action: "LOGIN",
						entityId: user.id,
						performedBy: user.id,
						ipAddress,
						details: {
							status: "SUCCESS",
							email: normalizedEmail,
						},
					});

					const tokenId = randomUUID();
					const expiresAt = new Date(
						Date.now() + 24 * 60 * 60 * 1000,
					);

					await db.userSession.create({
						data: {
							userId: user.id,
							tokenId,
							ipAddress,
							userAgent,
							expiresAt,
						},
					});

					// NEW: Look up parishioner record if any
					const parishioner = await db.parishioner.findUnique({
						where: { email: user.email },
					});

					// Return user data for JWT
					return {
						id: user.id,
						email: user.email,
						name: `${user.firstName} ${user.lastName}`,
						role: user.role,
						organizationId: user.organizationId,
						organizationName: user.organization?.name ?? null,
						parishionerId: parishioner?.id ?? null,
						sessionVersion: user.sessionVersion,
						sessionId: tokenId,
					};
				} catch (error) {
					// Handle Zod validation errors - return null to indicate invalid credentials
					if (error instanceof ZodError) {
						return null;
					}
					// Log unexpected errors and return null
					console.error("Auth error:", error);
					return null;
				}
			},
		}),
	],
	session: {
		strategy: "jwt",
		maxAge: 24 * 60 * 60, // 24 hours
	},
	callbacks: {
		async jwt({ token, user }) {
			// Initial sign in - extend token with custom user fields
			if (user) {
				token.id = user.id as string;
				token.role = (user as unknown as Record<string, unknown>)
					.role as string;
				token.organizationId = (
					user as unknown as Record<string, unknown>
				).organizationId as string;
				token.organizationName = (
					user as unknown as Record<string, unknown>
				).organizationName as string | null;
				token.parishionerId = (
					user as unknown as Record<string, unknown>
				).parishionerId as string | null;
				token.sessionVersion = (
					user as unknown as Record<string, unknown>
				).sessionVersion as number;
				token.sessionId = (user as unknown as Record<string, unknown>)
					.sessionId as string;
			}

			if (!token.id || typeof token.id !== "string") {
				return token;
			}

			const currentUser = await db.user.findUnique({
				where: { id: token.id },
				select: {
					isActive: true,
					lockedUntil: true,
					sessionVersion: true,
				},
			});

			if (!currentUser || !currentUser.isActive) {
				return {};
			}

			if (
				currentUser.lockedUntil &&
				currentUser.lockedUntil > new Date()
			) {
				return {};
			}

			if (
				typeof token.sessionVersion === "number" &&
				token.sessionVersion !== currentUser.sessionVersion
			) {
				return {};
			}

			if (!token.sessionId || typeof token.sessionId !== "string") {
				return {};
			}

			const activeSession = await db.userSession.findUnique({
				where: { tokenId: token.sessionId },
				select: {
					userId: true,
					revokedAt: true,
					expiresAt: true,
				},
			});

			if (!activeSession || activeSession.userId !== token.id) {
				return {};
			}

			if (
				activeSession.revokedAt ||
				activeSession.expiresAt <= new Date()
			) {
				return {};
			}

			await db.userSession.update({
				where: { tokenId: token.sessionId },
				data: { lastSeenAt: new Date() },
			});

			token.sessionVersion = currentUser.sessionVersion;
			return token;
		},
		session({ session, token }) {
			if (!token.id || typeof token.id !== "string") {
				return {
					...session,
					user: undefined,
				} as unknown as typeof session;
			}

			// Extend session with custom fields from token
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
				session.user.organizationId = token.organizationId as string;
				session.user.organizationName = token.organizationName as
					| string
					| null;
				session.user.parishionerId = token.parishionerId as
					| string
					| null;
				session.user.sessionId = token.sessionId as string;
			}
			return session;
		},
	},
	pages: {
		signIn: "/auth/login",
		error: "/auth/error",
	},
};
