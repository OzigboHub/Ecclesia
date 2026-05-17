"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import {
  requestUserAccountSchema,
  type RequestUserAccountInput,
} from "@/lib/validators/user.schema";
import type { ActionResponse } from "@/types";
import type { UserAccountRequestStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const REQUEST_ALLOWED_ROLES: UserRole[] = [
  "PARISH_STAFF",
  "OUTSTATION_ADMIN",
  "SOCIETY_PRESIDENT",
  "SOCIETY_SECRETARY",
  "PARISHIONER",
];

export type RequestWithMeta = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserAccountRequestStatus;
  message: string | null;
  createdAt: Date;
  organization: { id: string; name: string; parentId: string | null };
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

function generateTemporaryPassword() {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const specials = "!@#$%^&*";

  const pick = (source: string) =>
    source[Math.floor(Math.random() * source.length)];

  const base = [pick(upper), pick(lower), pick(digits), pick(specials)];

  const all = upper + lower + digits + specials;
  for (let i = base.length; i < 12; i += 1) {
    base.push(pick(all));
  }

  return base.sort(() => Math.random() - 0.5).join("");
}

async function getOutstationContext() {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" } as const;
  }
  if (session.user.role !== "OUTSTATION_ADMIN") {
    return { error: "Permission denied" } as const;
  }
  const organization = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { id: true, level: true, parentId: true },
  });
  if (!organization || organization.level !== "OUTSTATION") {
    return { error: "Permission denied" } as const;
  }

  return { session, organization } as const;
}

export async function createUserAccountRequest(
  formData: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const context = await getOutstationContext();
    if ("error" in context) {
      return { success: false, message: context.error as string };
    }

    const parsed = requestUserAccountSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload = parsed.data as RequestUserAccountInput;
    if (!REQUEST_ALLOWED_ROLES.includes(payload.role as UserRole)) {
      return {
        success: false,
        message: "You cannot request this role",
      };
    }

    const existingUser = await db.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });
    if (existingUser) {
      return {
        success: false,
        message: "A user with this email already exists",
        errors: { email: ["This email is already registered"] },
      };
    }

    const existingRequest = await db.userAccountRequest.findFirst({
      where: {
        email: payload.email,
        organizationId: context.organization.id,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingRequest) {
      return {
        success: false,
        message: "A request for this email is already pending",
      };
    }

    const request = await db.userAccountRequest.create({
      data: {
        organizationId: context.organization.id,
        requestedById: context.session.user.id,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        role: payload.role as UserRole,
        message: payload.message || null,
        status: "PENDING",
      },
      select: { id: true },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "User account request submitted",
      data: { id: request.id },
    };
  } catch (error) {
    console.error("Failed to create user request:", error);
    return { success: false, message: "Failed to submit request" };
  }
}

export async function getPendingUserAccountRequests(): Promise<
  ActionResponse<RequestWithMeta[]>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const isParishAdmin = session.user.role === "PARISH_ADMIN";
    if (!isSuperAdmin && !isParishAdmin) {
      return { success: false, message: "Permission denied" };
    }

    let organizationIds: string[] = [];
    if (isSuperAdmin) {
      const orgs = await db.organization.findMany({
        select: { id: true },
      });
      organizationIds = orgs.map((org) => org.id);
    } else {
      const outstations = await db.organization.findMany({
        where: {
          parentId: session.user.organizationId,
          level: "OUTSTATION",
        },
        select: { id: true },
      });
      organizationIds = [
        session.user.organizationId,
        ...outstations.map((o) => o.id),
      ];
    }

    const requests = await db.userAccountRequest.findMany({
      where: {
        organizationId: { in: organizationIds },
        status: "PENDING",
      },
      include: {
        organization: {
          select: { id: true, name: true, parentId: true },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      message: "Requests retrieved",
      data: requests,
    };
  } catch (error) {
    console.error("Failed to get user requests:", error);
    return { success: false, message: "Failed to retrieve requests" };
  }
}

export async function approveUserAccountRequest(
  requestId: string,
): Promise<ActionResponse<{ temporaryPassword: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const isParishAdmin = session.user.role === "PARISH_ADMIN";
    if (!isSuperAdmin && !isParishAdmin) {
      return { success: false, message: "Permission denied" };
    }

    const request = await db.userAccountRequest.findFirst({
      where: { id: requestId, status: "PENDING" },
      include: {
        organization: { select: { id: true, parentId: true } },
      },
    });

    if (!request) {
      return { success: false, message: "Request not found" };
    }

    if (
      isParishAdmin &&
      request.organization.parentId !== session.user.organizationId &&
      request.organization.id !== session.user.organizationId
    ) {
      return { success: false, message: "Permission denied" };
    }

    if (!REQUEST_ALLOWED_ROLES.includes(request.role)) {
      return {
        success: false,
        message: "Invalid role requested",
      };
    }

    const existingUser = await db.user.findUnique({
      where: { email: request.email },
      select: { id: true },
    });
    if (existingUser) {
      return { success: false, message: "User already exists" };
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          password: hashedPassword,
          role: request.role,
          organizationId: request.organizationId,
          isActive: true,
        },
      });

      if (request.role === "PARISHIONER") {
        const existingParishioner = await tx.parishioner.findUnique({
          where: { email: request.email },
          select: { id: true },
        });

        if (!existingParishioner) {
          await tx.parishioner.create({
            data: {
              firstName: request.firstName,
              lastName: request.lastName,
              email: request.email,
              organizationId: request.organizationId,
            },
          });
        }
      }

      await tx.userAccountRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      });
    });

    revalidatePath("/users");

    return {
      success: true,
      message: "Request approved",
      data: { temporaryPassword },
    };
  } catch (error) {
    console.error("Failed to approve request:", error);
    return { success: false, message: "Failed to approve request" };
  }
}

export async function rejectUserAccountRequest(
  requestId: string,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const isParishAdmin = session.user.role === "PARISH_ADMIN";
    if (!isSuperAdmin && !isParishAdmin) {
      return { success: false, message: "Permission denied" };
    }

    const request = await db.userAccountRequest.findFirst({
      where: { id: requestId, status: "PENDING" },
      include: { organization: { select: { id: true, parentId: true } } },
    });

    if (!request) {
      return { success: false, message: "Request not found" };
    }

    if (
      isParishAdmin &&
      request.organization.parentId !== session.user.organizationId &&
      request.organization.id !== session.user.organizationId
    ) {
      return { success: false, message: "Permission denied" };
    }

    await db.userAccountRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    revalidatePath("/users");

    return { success: true, message: "Request rejected" };
  } catch (error) {
    console.error("Failed to reject request:", error);
    return { success: false, message: "Failed to reject request" };
  }
}
