import { ACCESS_CODE_LENGTH } from "@/lib/access-code";
import db from "@/lib/db";
import { normaliseNgPhone } from "@/lib/phone";
import { loginSchema } from "@/lib/validators/auth.schema";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const IDLE_TIMEOUT_MINUTES = 30;

const STAFF_SESSION_MS = 24 * 60 * 60 * 1000;
const MEMBER_SESSION_MS = 180 * 24 * 60 * 60 * 1000;

/** Attempts allowed against one issued access code before it is burned. */
const MAX_ACCESS_CODE_ATTEMPTS = 5;

type SessionProfile = {
	maxAgeMs: number;
	/** Signing in revokes any other live session for the account. */
	singleSession: boolean;
	/** Revoke after 30 minutes of inactivity. */
	idleTimeout: boolean;
};

/**
 * How long a session lives and how strictly it is policed.
 *
 * Keyed on **role, not on how the person authenticated**. The single-session
 * rule and the idle timeout exist to protect the console — a shared parish
 * office computer that anyone can walk up to. That is a property of the surface
 * being used, not of which credential was presented to reach it.
 *
 * Keying on the credential instead would mean a parishioner who *added a
 * password* — that is, who improved their security — would suddenly be logged
 * out every thirty minutes and unable to keep the app on both their phone and
 * their tablet. Punishing people for climbing the ladder is the opposite of
 * what the ladder is for.
 */
function sessionProfileFor(role: unknown): SessionProfile {
	if (role === "PARISHIONER") {
		return {
			maxAgeMs: MEMBER_SESSION_MS,
			singleSession: false,
			idleTimeout: false,
		};
	}
	return {
		maxAgeMs: STAFF_SESSION_MS,
		singleSession: true,
		idleTimeout: true,
	};
}

/**
 * A short, human label for the Devices screen. Deliberately coarse: enough to
 * recognise "that's my phone", not a fingerprint.
 */
function describeDevice(userAgent: string | null): string | null {
	if (!userAgent) return null;

	const platform =
		/Android/i.test(userAgent) ? "Android"
		: /iPhone/i.test(userAgent) ? "iPhone"
		: /iPad/i.test(userAgent) ? "iPad"
		: /Windows/i.test(userAgent) ? "Windows"
		: /Macintosh/i.test(userAgent) ? "Mac"
		: null;

	const browser =
		/Edg\//i.test(userAgent) ? "Edge"
		: /OPR\//i.test(userAgent) ? "Opera"
		: /Chrome\//i.test(userAgent) ? "Chrome"
		: /Firefox\//i.test(userAgent) ? "Firefox"
		: /Safari\//i.test(userAgent) ? "Safari"
		: null;

	if (platform && browser) return `${platform} · ${browser}`;
	return platform ?? browser;
}

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
				twoFactorToken: { label: "2FA Token", type: "text" },
			},
			async authorize(credentials, request) {
				try {
					const rawEmail = credentials?.email;
					const twoFactorToken = credentials?.twoFactorToken;
					const hasTwoFactorToken =
						typeof twoFactorToken === "string" &&
						twoFactorToken.trim().length > 0;

					const normalizedEmail =
						typeof rawEmail === "string" ?
							rawEmail.toLowerCase().trim()
						:	"";

					if (!normalizedEmail || !normalizedEmail.includes("@")) {
						return null;
					}

					if (!hasTwoFactorToken) {
						// Validate credentials with Zod
						await loginSchema.parseAsync(credentials);
					}
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

					if (hasTwoFactorToken) {
						const challenge =
							await db.twoFactorChallenge.findUnique({
								where: {
									challengeToken: twoFactorToken as string,
								},
								select: {
									userId: true,
									expiresAt: true,
									consumedAt: true,
								},
							});

						if (!challenge || challenge.userId !== user.id) {
							return null;
						}

						if (!challenge.consumedAt) {
							return null;
						}

						if (challenge.expiresAt <= new Date()) {
							return null;
						}
					} else {
						// Verify password
						const isValid = await bcrypt.compare(
							(credentials?.password as string) ?? "",
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
					}

					// Profile follows the account's role, so a parishioner
					// signing in by password keeps the long-lived, multi-device
					// binding they had with a code.
					const profile = sessionProfileFor(user.role);

					// Kicking the previous session is a console protection. Do
					// it only for accounts that are held to one session at a
					// time — otherwise a member signing in on their phone would
					// silently sign out their tablet.
					if (profile.singleSession && user.activeSessionId) {
						const existingSession = await db.userSession.findUnique(
							{
								where: { tokenId: user.activeSessionId },
								select: {
									revokedAt: true,
									expiresAt: true,
									lastSeenAt: true,
								},
							},
						);

						if (existingSession) {
							if (!existingSession.revokedAt) {
								await db.userSession.update({
									where: { tokenId: user.activeSessionId },
									data: { revokedAt: new Date() },
								});
							}
						}

						await db.user.update({
							where: { id: user.id },
							data: { activeSessionId: null },
						});
					}

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
					const expiresAt = new Date(Date.now() + profile.maxAgeMs);

					await db.$transaction([
						db.userSession.create({
							data: {
								userId: user.id,
								tokenId,
								ipAddress,
								userAgent,
								expiresAt,
								authMethod: "password",
								deviceLabel: describeDevice(userAgent),
							},
						}),
						db.user.update({
							where: { id: user.id },
							data: {
								activeSessionId: tokenId,
								lastLogin: new Date(),
								failedLoginAttempts: 0,
								lastFailedLoginAt: null,
								lockedUntil: null,
							},
						}),
					]);

					// Resolved through the userId foreign key rather than by
					// matching email strings: a parishioner imported from a
					// paper register has no email to match on.
					const parishioner = await db.parishioner.findUnique({
						where: { userId: user.id },
						select: { id: true },
					});

					// Return user data for JWT
					return {
						id: user.id,
						email: user.email,
						name: `${user.firstName} ${user.lastName}`,
						displayPicture: user.displayPicture ?? undefined,
						role: user.role,
						organizationId: user.organizationId,
						organizationName: user.organization?.name ?? null,
						parishionerId: parishioner?.id ?? null,
						sessionVersion: user.sessionVersion,
						sessionId: tokenId,
						authMethod: "password" as const,
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

		/**
		 * Parishioner lock-in: phone number plus a one-time code the parish
		 * office issued.
		 *
		 * This returns the exact same object shape as the password provider
		 * above, which is what keeps the migration additive — every predicate
		 * in lib/permissions.ts and every server action reading session.user
		 * works unchanged for a member.
		 */
		Credentials({
			id: "parish-code",
			name: "Parish access code",
			credentials: {
				organizationId: { label: "Parish", type: "text" },
				phone: { label: "Phone number", type: "tel" },
				code: { label: "Access code", type: "text" },
			},
			async authorize(credentials, request) {
				try {
					const organizationId =
						typeof credentials?.organizationId === "string" ?
							credentials.organizationId.trim()
						:	"";
					const rawPhone =
						typeof credentials?.phone === "string" ?
							credentials.phone
						:	"";
					const rawCode =
						typeof credentials?.code === "string" ?
							credentials.code
						:	"";

					if (!organizationId || !rawPhone || !rawCode) return null;

					const phone = normaliseNgPhone(rawPhone);
					if (!phone.ok) return null;

					const code = rawCode.trim().toUpperCase();
					if (code.length !== ACCESS_CODE_LENGTH) return null;

					const ipAddress = getClientIp(request);
					const userAgent =
						request?.headers.get("user-agent") ?? null;

					// Scoped to the one parish the person selected. A phone
					// number is only unique within a parish, and scoping also
					// means this cannot be used to enumerate the platform.
					const parishioner = await db.parishioner.findFirst({
						where: {
							organizationId,
							phoneE164: phone.e164,
							deletedAt: null,
							isActive: true,
						},
						select: {
							id: true,
							firstName: true,
							lastName: true,
							photoUrl: true,
							userId: true,
							organizationId: true,
							organization: { select: { id: true, name: true } },
						},
					});

					if (!parishioner) return null;

					const record = await db.parishAccessCode.findFirst({
						where: {
							parishionerId: parishioner.id,
							organizationId,
							consumedAt: null,
							revokedAt: null,
							expiresAt: { gt: new Date() },
						},
						orderBy: { issuedAt: "desc" },
					});

					if (!record) return null;

					if (record.attempts >= MAX_ACCESS_CODE_ATTEMPTS) {
						await db.parishAccessCode.update({
							where: { id: record.id },
							data: { revokedAt: new Date() },
						});
						return null;
					}

					const codeMatches = await bcrypt.compare(
						code,
						record.codeHash,
					);

					if (!codeMatches) {
						await db.parishAccessCode.update({
							where: { id: record.id },
							data: { attempts: { increment: 1 } },
						});
						await logAuthEvent({
							action: "LOGIN",
							entityId: parishioner.id,
							performedBy: "SYSTEM",
							ipAddress,
							details: {
								status: "FAILED",
								reason: "INVALID_ACCESS_CODE",
								method: "parish-code",
								organizationId,
								attempts: record.attempts + 1,
							},
						});
						return null;
					}

					// A parishioner may not have a login account yet — the
					// common case, since the register was imported from paper.
					// Create one lazily, with no email and no password.
					let account =
						parishioner.userId ?
							await db.user.findUnique({
								where: { id: parishioner.userId },
								include: { organization: true },
							})
						:	null;

					// This person closed the code door behind them: they hold a
					// password and two-factor, and asked that a code no longer
					// be enough. Honouring that here is what makes rung 3 real
					// rather than decorative.
					if (account && !account.allowCodeSignIn) {
						await logAuthEvent({
							action: "LOGIN",
							entityId: account.id,
							performedBy: "SYSTEM",
							ipAddress,
							details: {
								status: "FAILED",
								reason: "CODE_SIGN_IN_DISABLED",
								method: "parish-code",
								organizationId,
							},
						});
						return null;
					}

					if (!account) {
						account = await db.user.create({
							data: {
								firstName: parishioner.firstName,
								lastName: parishioner.lastName,
								role: "PARISHIONER",
								organizationId: parishioner.organizationId,
								displayPicture: parishioner.photoUrl,
							},
							include: { organization: true },
						});
						await db.parishioner.update({
							where: { id: parishioner.id },
							data: { userId: account.id },
						});
					}

					if (!account.isActive) return null;

					const tokenId = randomUUID();
					const expiresAt = new Date(
						Date.now() + sessionProfileFor(account.role).maxAgeMs,
					);

					await db.$transaction([
						// Single use: burn the code the moment it works.
						db.parishAccessCode.update({
							where: { id: record.id },
							data: { consumedAt: new Date() },
						}),
						// Note there is no activeSessionId write here. Members
						// hold several devices at once; see the jwt callback.
						db.userSession.create({
							data: {
								userId: account.id,
								tokenId,
								ipAddress,
								userAgent,
								expiresAt,
								authMethod: "parish-code",
								deviceLabel: describeDevice(userAgent),
							},
						}),
						db.user.update({
							where: { id: account.id },
							data: { lastLogin: new Date() },
						}),
					]);

					await logAuthEvent({
						action: "LOGIN",
						entityId: account.id,
						performedBy: account.id,
						ipAddress,
						details: {
							status: "SUCCESS",
							method: "parish-code",
							organizationId,
							parishionerId: parishioner.id,
						},
					});

					return {
						id: account.id,
						email: account.email,
						name: `${account.firstName} ${account.lastName}`,
						displayPicture: account.displayPicture ?? undefined,
						role: account.role,
						organizationId: account.organizationId,
						organizationName:
							account.organization?.name ??
							parishioner.organization.name,
						parishionerId: parishioner.id,
						sessionVersion: account.sessionVersion,
						sessionId: tokenId,
						authMethod: "parish-code" as const,
					};
				} catch (error) {
					console.error("Parish code auth error:", error);
					return null;
				}
			},
		}),
	],
	session: {
		strategy: "jwt",
		// Long enough for a member's device binding. Staff are not affected:
		// their 24-hour UserSession.expiresAt and 30-minute idle check below
		// invalidate the token server-side long before this.
		maxAge: MEMBER_SESSION_MS / 1000,
	},
	callbacks: {
		async jwt({ token, user, trigger, session }) {
			// Initial sign in - extend token with custom user fields
			if (user) {
				token.id = user.id as string;
				token.role = (user as unknown as Record<string, unknown>)
					.role as string;
				token.displayPicture = (
					user as unknown as Record<string, unknown>
				).displayPicture as string;
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
				token.authMethod = ((
					user as unknown as Record<string, unknown>
				).authMethod ?? "password") as AuthMethod;
			}

			// Tokens minted before this field existed are staff logins.
			if (!token.authMethod) token.authMethod = "password";

			if (trigger === "update" && session?.user) {
				token.organizationId =
					session.user.organizationId ?? token.organizationId;
				token.organizationName =
					session.user.organizationName ?? token.organizationName;
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
					activeSessionId: true,
					organizationId: true,
					firstName: true,
					lastName: true,
					displayPicture: true,
					// Refreshed on every check because a member can acquire an
					// email mid-session by climbing the security ladder. Without
					// this the token would keep claiming they have none until
					// they next signed in.
					email: true,
					role: true,
					organization: { select: { name: true } },
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

			const idleCutoff = new Date(
				Date.now() - IDLE_TIMEOUT_MINUTES * 60 * 1000,
			);

			const activeSession = await db.userSession.findUnique({
				where: { tokenId: token.sessionId },
				select: {
					userId: true,
					revokedAt: true,
					expiresAt: true,
					lastSeenAt: true,
				},
			});

			// From the record rather than the token, so a role change takes
			// effect on the next request instead of at the next sign-in.
			const profile = sessionProfileFor(currentUser.role);

			// Members are device-bound and hold several devices at once, so
			// they skip the single-active-session reconciliation entirely.
			// Touching activeSessionId here would make signing in on a phone
			// silently revoke the tablet — and the Devices screen exists
			// precisely because that is not what should happen.
			if (profile.singleSession) {
				if (!currentUser.activeSessionId) {
					if (
						!activeSession ||
						activeSession.userId !== token.id ||
						activeSession.revokedAt ||
						activeSession.expiresAt <= new Date()
					) {
						return {};
					}

					await db.user.update({
						where: { id: token.id },
						data: { activeSessionId: token.sessionId },
					});
				} else if (currentUser.activeSessionId !== token.sessionId) {
					const expectedSession = await db.userSession.findUnique({
						where: { tokenId: currentUser.activeSessionId },
						select: {
							revokedAt: true,
							expiresAt: true,
							lastSeenAt: true,
						},
					});

					const expectedStillActive =
						!!expectedSession &&
						!expectedSession.revokedAt &&
						expectedSession.expiresAt > new Date() &&
						expectedSession.lastSeenAt > idleCutoff;

					if (expectedStillActive) {
						return {};
					}

					if (
						!activeSession ||
						activeSession.userId !== token.id ||
						activeSession.revokedAt ||
						activeSession.expiresAt <= new Date()
					) {
						return {};
					}

					await db.user.update({
						where: { id: token.id },
						data: { activeSessionId: token.sessionId },
					});
				}
			}

			if (!activeSession || activeSession.userId !== token.id) {
				return {};
			}

			if (
				activeSession.revokedAt ||
				activeSession.expiresAt <= new Date()
			) {
				return {};
			}

			// Idle timeout is a console protection. A parishioner who opens the
			// app once a fortnight has not done anything suspicious, so the
			// binding survives until it expires or they sign the device out.
			if (profile.idleTimeout && activeSession.lastSeenAt <= idleCutoff) {
				await db.$transaction([
					db.userSession.update({
						where: { tokenId: token.sessionId },
						data: { revokedAt: new Date() },
					}),
					db.user.update({
						where: { id: token.id },
						data: { activeSessionId: null },
					}),
				]);
				return {};
			}

			await db.userSession.update({
				where: { tokenId: token.sessionId },
				data: { lastSeenAt: new Date() },
			});

			let contextId: string | undefined;
			try {
				const cookieStore = await cookies();
				contextId =
					token.role === "SUPER_ADMIN" ?
						cookieStore.get("org-context-id")?.value
					:	undefined;
			} catch {
				// Cookies API is not available in all Auth.js callback execution contexts
			}
			let contextOrganization: {
				id: string;
				name: string | null;
			} | null = null;
			if (contextId) {
				contextOrganization = await db.organization.findUnique({
					where: { id: contextId },
					select: { id: true, name: true },
				});
			}

			let defaultOrganization: {
				id: string;
				name: string | null;
			} | null =
				currentUser.organizationId ?
					{
						id: currentUser.organizationId,
						name: currentUser.organization?.name ?? null,
					}
				:	null;

			if (token.role === "SUPER_ADMIN" && !contextOrganization) {
				const firstOrganization = await db.organization.findFirst({
					orderBy: { createdAt: "asc" },
					select: { id: true, name: true },
				});

				if (firstOrganization) {
					defaultOrganization = firstOrganization;
					if (currentUser.organizationId !== firstOrganization.id) {
						await db.user.update({
							where: { id: token.id },
							data: { organizationId: firstOrganization.id },
						});
					}
				}
			}

			token.sessionVersion = currentUser.sessionVersion;
			token.email = currentUser.email ?? undefined;
			token.role = currentUser.role;
			token.name = `${currentUser.firstName} ${currentUser.lastName}`;
			token.displayPicture = currentUser.displayPicture ?? undefined;
			token.organizationId =
				contextOrganization?.id ??
				defaultOrganization?.id ??
				currentUser.organizationId;
			token.organizationName =
				contextOrganization?.name ??
				defaultOrganization?.name ??
				currentUser.organization?.name ??
				null;
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
				session.user.displayPicture = token.displayPicture as string;
				session.user.organizationId = token.organizationId as string;
				session.user.organizationName = token.organizationName as
					| string
					| null;
				session.user.parishionerId = token.parishionerId as
					| string
					| null;
				session.user.sessionId = token.sessionId as string;
				session.user.authMethod =
					(token.authMethod as AuthMethod) ?? "password";
			}
			return session;
		},
	},
	pages: {
		signIn: "/auth/login",
		error: "/auth/error",
	},
};
