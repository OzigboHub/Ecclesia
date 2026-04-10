"use server";

import { auth, signIn, signOut } from "@/auth";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateEmailOtp,
  generateTotpSecret,
  verifyTotpCode,
} from "@/lib/auth/two-factor";
import db from "@/lib/db";
import {
  loginSchema,
  registerSchemaServer,
  resetPasswordSchema,
  twoFactorConfirmSchema,
  twoFactorEnrollmentConfirmSchema,
  twoFactorEnrollmentSchema,
  twoFactorSetupSchema,
  twoFactorVerifySchema,
} from "@/lib/validators/auth.schema";
import type { ActionResponse } from "@/types";
import type { Prisma } from "@prisma/client";
import { TwoFactorMethod, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";

function minutesUntil(date: Date): number {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 60000);
}

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const SINGLE_DEVICE_IDLE_MINUTES = 1;
const TWO_FACTOR_OTP_TTL_MINUTES = 5;
const TWO_FACTOR_SETUP_TTL_MINUTES = 10;
const TWO_FACTOR_MAX_ATTEMPTS = 5;

function getMailSender() {
  const fromAddress = "support@ecclesialight.com";
  const fromName = process.env.RESEND_FROM_NAME?.trim() || "Ecclesia";

  return `${fromName} <${fromAddress}>`;
}

async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — email not sent");
    return {
      success: false,
      message:
        "Email verification is unavailable because the mail service is not configured.",
    } as const;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: getMailSender(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("Failed to send transactional email:", error);
      return {
        success: false,
        message:
          "We could not send the verification email. Check your sender configuration and try again.",
      } as const;
    }

    return { success: true } as const;
  } catch (error) {
    console.error("Transactional email delivery error:", error);
    return {
      success: false,
      message:
        "We could not send the verification email. Check your mail settings and try again.",
    } as const;
  }
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

function isTwoFactorRole(role: UserRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "PARISH_ADMIN" ||
    role === "PARISH_SECRETARY"
  );
}

async function getActiveSessionForUser(
  userId: string,
  activeSessionId: string | null,
) {
  if (!activeSessionId) return null;
  return db.userSession.findUnique({
    where: { tokenId: activeSessionId },
    select: {
      revokedAt: true,
      expiresAt: true,
      lastSeenAt: true,
    },
  });
}

async function incrementFailedLogin(userId: string, email: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  const attempts = (user?.failedLoginAttempts ?? 0) + 1;
  const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
    : null;

  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: attempts,
      lastFailedLoginAt: new Date(),
      lockedUntil,
    },
  });

  await logAuthAction({
    action: "LOGIN",
    entityId: userId,
    performedBy: userId,
    details: {
      status: "FAILED",
      reason: "INVALID_CREDENTIALS",
      email,
      failedLoginAttempts: attempts,
      lockedUntil: lockedUntil?.toISOString() ?? null,
    },
  });
}

async function createTwoFactorChallenge(params: {
  userId: string;
  email: string;
  method: TwoFactorMethod;
}) {
  const challengeToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + TWO_FACTOR_OTP_TTL_MINUTES * 60 * 1000,
  );
  const ipAddress = await getActionIpAddress();
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent");

  if (params.method === "EMAIL") {
    const { code, codeHash } = generateEmailOtp();

    await db.twoFactorChallenge.create({
      data: {
        userId: params.userId,
        method: params.method,
        challengeToken,
        codeHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    const emailResult = await sendTransactionalEmail({
      to: params.email,
      subject: "Your verification code",
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
											<h2 style="margin:0 0 16px 0;color:#333;">Verify your sign-in</h2>
											<p style="font-size:14px;color:#444;line-height:1.6;">Enter this code to finish signing in:</p>
											<div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#c9a84c;margin:16px 0;">${code}</div>
											<p style="font-size:13px;color:#888;">This code expires in ${TWO_FACTOR_OTP_TTL_MINUTES} minutes.</p>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
				</div>
			`,
    });

    if (!emailResult.success) {
      await db.twoFactorChallenge.deleteMany({
        where: { challengeToken },
      });
      throw new Error(emailResult.message);
    }

    return { challengeToken, method: params.method };
  }

  await db.twoFactorChallenge.create({
    data: {
      userId: params.userId,
      method: params.method,
      challengeToken,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { challengeToken, method: params.method };
}

async function createTwoFactorSetupToken(userId: string) {
  await db.twoFactorSetupToken.deleteMany({
    where: { userId },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + TWO_FACTOR_SETUP_TTL_MINUTES * 60 * 1000,
  );

  await db.twoFactorSetupToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
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
        email: true,
        password: true,
        role: true,
        isActive: true,
        lockedUntil: true,
        failedLoginAttempts: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        activeSessionId: true,
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
          remaining > 0
            ? `Account temporarily locked. Try again in ${remaining} minute(s).`
            : "Account temporarily locked. Try again shortly.",
      };
    }

    if (!user || !user.password) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    const shouldRequireTwoFactor = isTwoFactorRole(user.role);
    const hasTwoFactorConfigured =
      user.twoFactorEnabled && user.twoFactorMethod;

    if (shouldRequireTwoFactor) {
      const isValid = await bcrypt.compare(parsed.data.password, user.password);

      if (!isValid) {
        await incrementFailedLogin(user.id, normalizedEmail);
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      if (user.activeSessionId) {
        const existingSession = await getActiveSessionForUser(
          user.id,
          user.activeSessionId,
        );
        if (existingSession) {
          if (!existingSession.revokedAt) {
            await db.userSession.update({
              where: { tokenId: user.activeSessionId },
              data: { revokedAt: new Date() },
            });
          }

          await db.user.update({
            where: { id: user.id },
            data: { activeSessionId: null },
          });
        }
      }

      if (!hasTwoFactorConfigured) {
        const setupToken = await createTwoFactorSetupToken(user.id);
        return {
          success: true,
          message: "Two-factor setup required",
          data: {
            requiresTwoFactorSetup: true,
            setupToken,
          },
        };
      }

      const challenge = await createTwoFactorChallenge({
        userId: user.id,
        email: normalizedEmail,
        method: user.twoFactorMethod as any,
      });
      return {
        success: true,
        message: "Two-factor verification required",
        data: {
          requiresTwoFactor: true,
          challengeToken: challenge.challengeToken,
          method: challenge.method,
        },
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
        if (refreshed?.lockedUntil && refreshed.lockedUntil > new Date()) {
          const remaining = minutesUntil(refreshed.lockedUntil);
          return {
            success: false,
            message:
              remaining > 0
                ? `Too many failed attempts. Try again in ${remaining} minute(s).`
                : "Too many failed attempts. Try again shortly.",
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
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function startTwoFactorEnrollment(data: {
  setupToken: string;
  method: "EMAIL" | "TOTP";
}): Promise<
  ActionResponse<{
    challengeToken: string;
    otpauthUrl?: string;
    secret?: string;
  }>
> {
  try {
    const parsed = twoFactorEnrollmentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid setup request",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const setupSession = await db.twoFactorSetupToken.findUnique({
      where: { token: parsed.data.setupToken },
      include: { user: true },
    });

    if (!setupSession || setupSession.expiresAt <= new Date()) {
      return { success: false, message: "Setup session expired" };
    }

    if (setupSession.user.twoFactorEnabled) {
      return { success: false, message: "Two-factor already enabled" };
    }

    if (!isTwoFactorRole(setupSession.user.role)) {
      return { success: false, message: "Two-factor not required" };
    }

    if (parsed.data.method === "TOTP") {
      const { secret, otpauthUrl } = generateTotpSecret(
        setupSession.user.email,
      );

      await db.user.update({
        where: { id: setupSession.userId },
        data: {
          twoFactorMethod: "TOTP",
          twoFactorSecret: encryptTotpSecret(secret),
          twoFactorEnabled: false,
          twoFactorConfirmedAt: null,
        },
      });

      const challenge = await createTwoFactorChallenge({
        userId: setupSession.userId,
        email: setupSession.user.email,
        method: "TOTP",
      });

      return {
        success: true,
        message: "Authenticator setup started",
        data: {
          challengeToken: challenge.challengeToken,
          secret,
          otpauthUrl,
        },
      };
    }

    await db.user.update({
      where: { id: setupSession.userId },
      data: {
        twoFactorMethod: "EMAIL",
        twoFactorEnabled: false,
        twoFactorConfirmedAt: null,
      },
    });

    const challenge = await createTwoFactorChallenge({
      userId: setupSession.userId,
      email: setupSession.user.email,
      method: "EMAIL",
    });

    return {
      success: true,
      message: "Email verification sent",
      data: { challengeToken: challenge.challengeToken },
    };
  } catch (error) {
    console.error("Two-factor enrollment error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to start setup",
    };
  }
}

export async function confirmTwoFactorEnrollment(data: {
  setupToken: string;
  challengeToken: string;
  method: "EMAIL" | "TOTP";
  code: string;
}): Promise<ActionResponse> {
  try {
    const parsed = twoFactorEnrollmentConfirmSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid confirmation request",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const setupSession = await db.twoFactorSetupToken.findUnique({
      where: { token: parsed.data.setupToken },
      include: { user: true },
    });

    if (!setupSession || setupSession.expiresAt <= new Date()) {
      return { success: false, message: "Setup session expired" };
    }

    if (setupSession.user.twoFactorEnabled) {
      return { success: false, message: "Two-factor already enabled" };
    }

    const challenge = await db.twoFactorChallenge.findUnique({
      where: { challengeToken: parsed.data.challengeToken },
    });

    if (!challenge || challenge.userId !== setupSession.userId) {
      return { success: false, message: "Invalid verification" };
    }

    if (challenge.expiresAt <= new Date()) {
      return { success: false, message: "Verification code expired" };
    }

    if (challenge.consumedAt) {
      return { success: false, message: "Verification already used" };
    }

    if (challenge.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      return { success: false, message: "Too many attempts" };
    }

    if (parsed.data.method === "EMAIL") {
      const hashed = crypto
        .createHash("sha256")
        .update(parsed.data.code.trim())
        .digest("hex");
      if (hashed !== challenge.codeHash) {
        await db.twoFactorChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        return { success: false, message: "Invalid verification code" };
      }
    } else {
      const secret = setupSession.user.twoFactorSecret
        ? decryptTotpSecret(setupSession.user.twoFactorSecret)
        : null;
      if (!secret) {
        return {
          success: false,
          message: "Authenticator not configured",
        };
      }
      const isValid = verifyTotpCode(secret, parsed.data.code.trim());
      if (!isValid) {
        await db.twoFactorChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        return { success: false, message: "Invalid verification code" };
      }
    }

    await db.$transaction([
      db.twoFactorChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
      db.user.update({
        where: { id: setupSession.userId },
        data: {
          twoFactorEnabled: true,
          twoFactorMethod: parsed.data.method,
          twoFactorConfirmedAt: new Date(),
        },
      }),
      db.twoFactorSetupToken.delete({
        where: { id: setupSession.id },
      }),
    ]);

    const result = await signIn("credentials", {
      email: setupSession.user.email,
      twoFactorToken: parsed.data.challengeToken,
      redirect: false,
    });

    if (!result || result.error) {
      return { success: false, message: "Verification failed" };
    }

    return { success: true, message: "Two-factor enabled" };
  } catch (error) {
    console.error("Two-factor enrollment confirm error:", error);
    return { success: false, message: "Failed to confirm setup" };
  }
}

export async function verifyTwoFactor(data: {
  email: string;
  challengeToken: string;
  code: string;
}): Promise<ActionResponse> {
  try {
    const parsed = twoFactorVerifySchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid verification details",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        twoFactorMethod: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        role: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorMethod) {
      return { success: false, message: "Two-factor not enabled" };
    }

    if (!isTwoFactorRole(user.role)) {
      return { success: false, message: "Two-factor not required" };
    }

    const challenge = await db.twoFactorChallenge.findUnique({
      where: { challengeToken: parsed.data.challengeToken },
    });

    if (!challenge || challenge.userId !== user.id) {
      return { success: false, message: "Invalid verification attempt" };
    }

    if (challenge.expiresAt <= new Date()) {
      return { success: false, message: "Verification code expired" };
    }

    if (challenge.consumedAt) {
      return { success: false, message: "Verification already used" };
    }

    if (challenge.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      return { success: false, message: "Too many attempts" };
    }

    if (user.twoFactorMethod === "EMAIL") {
      const hashed = crypto
        .createHash("sha256")
        .update(parsed.data.code.trim())
        .digest("hex");
      if (hashed !== challenge.codeHash) {
        await db.twoFactorChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        return { success: false, message: "Invalid verification code" };
      }
    } else {
      if (!user.twoFactorSecret) {
        return {
          success: false,
          message: "Authenticator is not configured",
        };
      }

      const secret = decryptTotpSecret(user.twoFactorSecret);
      const isValid = verifyTotpCode(secret, parsed.data.code.trim());
      if (!isValid) {
        await db.twoFactorChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        return { success: false, message: "Invalid verification code" };
      }
    }

    await db.twoFactorChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    const result = await signIn("credentials", {
      email: normalizedEmail,
      twoFactorToken: parsed.data.challengeToken,
      redirect: false,
    });

    if (!result || result.error) {
      return { success: false, message: "Verification failed" };
    }

    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error("Two-factor verification error:", error);
    return { success: false, message: "Verification failed" };
  }
}

export async function getTwoFactorStatus(): Promise<
  ActionResponse<{
    enabled: boolean;
    method: TwoFactorMethod | null;
    confirmedAt: Date | null;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorMethod: true,
        twoFactorConfirmedAt: true,
      },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      message: "Two-factor status retrieved",
      data: {
        enabled: user.twoFactorEnabled,
        method: user.twoFactorMethod,
        confirmedAt: user.twoFactorConfirmedAt,
      },
    };
  } catch (error) {
    console.error("Two-factor status error:", error);
    return { success: false, message: "Failed to load status" };
  }
}

export async function startTwoFactorSetup(data: {
  method: "EMAIL" | "TOTP";
}): Promise<
  ActionResponse<{
    challengeToken?: string;
    otpauthUrl?: string;
    secret?: string;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return { success: false, message: "Unauthorized" };
    }

    const parsed = twoFactorSetupSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid setup details",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    if (!isTwoFactorRole(session.user.role as UserRole)) {
      return {
        success: false,
        message: "Two-factor is not required for this account",
      };
    }

    if (parsed.data.method === "TOTP") {
      const { secret, otpauthUrl } = generateTotpSecret(session.user.email);
      await db.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorMethod: "TOTP",
          twoFactorSecret: encryptTotpSecret(secret),
          twoFactorEnabled: false,
          twoFactorConfirmedAt: null,
        },
      });

      return {
        success: true,
        message: "Authenticator setup started",
        data: { secret, otpauthUrl },
      };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorMethod: "EMAIL",
        twoFactorEnabled: false,
        twoFactorConfirmedAt: null,
      },
    });

    const challenge = await createTwoFactorChallenge({
      userId: session.user.id,
      email: session.user.email,
      method: "EMAIL",
    });

    return {
      success: true,
      message: "Email verification sent",
      data: { challengeToken: challenge.challengeToken },
    };
  } catch (error) {
    console.error("Two-factor setup error:", error);
    return { success: false, message: "Failed to start setup" };
  }
}

export async function confirmTwoFactorSetup(data: {
  method: "EMAIL" | "TOTP";
  code: string;
  challengeToken?: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const parsed = twoFactorConfirmSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid confirmation details",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    if (parsed.data.method === "EMAIL") {
      if (!parsed.data.challengeToken) {
        return {
          success: false,
          message: "Challenge token is required",
        };
      }

      const challenge = await db.twoFactorChallenge.findUnique({
        where: { challengeToken: parsed.data.challengeToken },
      });
      if (!challenge || challenge.userId !== session.user.id) {
        return { success: false, message: "Invalid verification" };
      }
      if (challenge.expiresAt <= new Date()) {
        return { success: false, message: "Verification code expired" };
      }
      if (challenge.consumedAt) {
        return { success: false, message: "Verification already used" };
      }

      const hashed = crypto
        .createHash("sha256")
        .update(parsed.data.code.trim())
        .digest("hex");
      if (hashed !== challenge.codeHash) {
        await db.twoFactorChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        return { success: false, message: "Invalid verification code" };
      }

      await db.$transaction([
        db.twoFactorChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        }),
        db.user.update({
          where: { id: session.user.id },
          data: {
            twoFactorEnabled: true,
            twoFactorConfirmedAt: new Date(),
          },
        }),
      ]);

      return { success: true, message: "Two-factor enabled" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      return { success: false, message: "Authenticator not configured" };
    }

    const secret = decryptTotpSecret(user.twoFactorSecret);
    const isValid = verifyTotpCode(secret, parsed.data.code.trim());
    if (!isValid) {
      return { success: false, message: "Invalid verification code" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorConfirmedAt: new Date(),
      },
    });

    return { success: true, message: "Two-factor enabled" };
  } catch (error) {
    console.error("Two-factor confirm error:", error);
    return { success: false, message: "Failed to confirm setup" };
  }
}

export async function disableTwoFactor(): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        twoFactorSecret: null,
        twoFactorConfirmedAt: null,
      },
    });

    await db.twoFactorChallenge.deleteMany({
      where: { userId: session.user.id },
    });

    return { success: true, message: "Two-factor disabled" };
  } catch (error) {
    console.error("Two-factor disable error:", error);
    return { success: false, message: "Failed to disable two-factor" };
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

        await db.user.update({
          where: { id: session.user.id },
          data: { activeSessionId: null },
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

    const userRole = (parsed.data.role as unknown as UserRole) || "PARISHIONER";

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

    const emailResult = await sendTransactionalEmail({
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
    if (!emailResult.success) {
      console.warn(emailResult.message);
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
      data: { sessionVersion: { increment: 1 }, activeSessionId: null },
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

    if (sessionId === session.user.sessionId) {
      await db.user.update({
        where: { id: session.user.id },
        data: { activeSessionId: null },
      });
    }

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
