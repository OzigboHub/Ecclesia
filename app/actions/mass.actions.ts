"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import {
  generateMassesForPeriod,
  generateMassesFromExistingMasses,
} from "@/lib/services/mass.service";
import { assignDefaultPaymentTypesToSundayMasses } from "@/app/actions/payment-type.actions";
import type { ActionResponse } from "@/types";
import { MassType } from "@prisma/client";
import { revalidatePath } from "next/cache";

function toUtcDayStart(value: Date | string): Date {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toUtcDayEnd(value: Date | string): Date {
  const d = new Date(value);
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function addUtcDays(value: Date, days: number): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate() + days,
    ),
  );
}

function parseMassDayInput(value: Date | string): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  return toUtcDayStart(value);
}

export async function getMasses(
  date: Date | string,
  organizationId?: string,
): Promise<ActionResponse<any>> {
  try {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized" };

    // Use provided organizationId or default to user's organization
    const targetOrgId = organizationId || session.user.organizationId;

    // Verify user can access this organization
    if (organizationId && organizationId !== session.user.organizationId) {
      const org = await db.organization.findUnique({
        where: { id: organizationId },
        select: { parentId: true },
      });

      if (!org || org.parentId !== session.user.organizationId) {
        return {
          success: false,
          message: "You do not have access to this organization",
        };
      }
    }

    const searchDate = parseMassDayInput(date);
    const masses = await db.mass.findMany({
      where: {
        organizationId: targetOrgId,
        date: {
          gte: toUtcDayStart(searchDate),
          lte: toUtcDayEnd(searchDate),
        },
      },
      orderBy: { time: "asc" },
      include: {
        _count: {
          select: { intentions: true },
        },
        intentions: {
          include: {
            parishioner: true,
          },
        },
      },
    });

    return { success: true, message: "Masses retrieved", data: masses };
  } catch (error) {
    console.error("Failed to get masses:", error);
    return { success: false, message: "Failed to get masses" };
  }
}

export async function getMassesInRange(
  startDate: Date | string,
  endDate: Date | string,
  organizationId?: string,
): Promise<ActionResponse<any>> {
  try {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized" };

    // Use provided organizationId or default to user's organization
    const targetOrgId = organizationId || session.user.organizationId;

    // Verify user can access this organization
    // (user can access their own org or child orgs if they're a priest)
    if (organizationId && organizationId !== session.user.organizationId) {
      // Check if this is a child organization (outstation)
      const org = await db.organization.findUnique({
        where: { id: organizationId },
        select: { parentId: true },
      });

      if (!org || org.parentId !== session.user.organizationId) {
        return {
          success: false,
          message: "You do not have access to this organization",
        };
      }
    }

    const start = parseMassDayInput(startDate);
    const end = parseMassDayInput(endDate);

    const masses = await db.mass.findMany({
      where: {
        organizationId: targetOrgId,
        date: {
          gte: toUtcDayStart(start),
          lte: toUtcDayEnd(end),
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        intentions: {
          include: {
            parishioner: true,
          },
        },
      },
    });

    return { success: true, message: "Masses retrieved", data: masses };
  } catch (error) {
    console.error("Failed to get masses in range:", error);
    return { success: false, message: "Failed to get masses" };
  }
}

export async function createMass(data: any): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (
      !session ||
      !["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"].includes(
        session.user.role,
      )
    ) {
      return { success: false, message: "Unauthorized" };
    }

    const date = parseMassDayInput(data.date);
    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { maxMassesPerDay: true },
    });

    if (!org) return { success: false, message: "Organization not found" };

    const dailyLimit = Math.min(org.maxMassesPerDay, 5);

    const count = await db.mass.count({
      where: {
        organizationId: session.user.organizationId,
        date: {
          gte: toUtcDayStart(date),
          lte: toUtcDayEnd(date),
        },
        status: { not: "CANCELLED" },
      },
    });

    if (count >= dailyLimit) {
      return {
        success: false,
        message: `Maximum of ${dailyLimit} masses allowed per day.`,
      };
    }

    const existingAtSameTime = await db.mass.findFirst({
      where: {
        organizationId: session.user.organizationId,
        date: {
          gte: toUtcDayStart(date),
          lte: toUtcDayEnd(date),
        },
        time: data.time,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });

    if (existingAtSameTime) {
      return {
        success: false,
        message: "A mass already exists at this time for the selected day.",
      };
    }

    const mass = await db.mass.create({
      data: {
        organizationId: session.user.organizationId,
        date: date,
        time: data.time,
        massType: data.massType as MassType,
        language: data.language,
        location: data.location,
        celebrant: data.celebrant,
        maxIntentions: data.maxIntentions || 1,
        isAutoGenerated: false,
      },
    });

    revalidatePath("/masses");
    revalidatePath("/mass-schedule");
    revalidatePath("/mass");
    revalidatePath(`/p/${session.user.organizationId}`);
    return { success: true, message: "Mass created", data: mass };
  } catch (error) {
    console.error("Failed to create mass:", error);
    return { success: false, message: "Failed to create mass" };
  }
}

export async function runMassGeneration(
  startDate?: Date | string,
  endDate?: Date | string,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (
      !session ||
      !["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"].includes(
        session.user.role,
      )
    ) {
      return { success: false, message: "Unauthorized" };
    }

    const start = startDate ? parseMassDayInput(startDate) : toUtcDayStart(new Date());
    const end = endDate ? parseMassDayInput(endDate) : addUtcDays(start, 30);

    const count = await generateMassesForPeriod(
      session.user.organizationId,
      start,
      end,
    );

    if (count === 0) {
      return {
        success: true,
        message:
          "No new masses generated. Check if you have active templates or if the limit is reached.",
      };
    }

    // Auto-assign default payment types to newly created Sunday masses
    await assignDefaultPaymentTypesToSundayMasses(session.user.organizationId);

    revalidatePath("/masses");
    revalidatePath("/mass-schedule");
    revalidatePath("/mass");
    revalidatePath(`/p/${session.user.organizationId}`);
    return {
      success: true,
      message: `Successfully generated ${count} masses.`,
    };
  } catch (e) {
    console.error("Mass generation failed:", e);
    return { success: false, message: "Generation failed" };
  }
}

export async function updateMass(
  id: string,
  data: any,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (
      !session ||
      !["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"].includes(
        session.user.role,
      )
    ) {
      return { success: false, message: "Unauthorized" };
    }

    const existingMass = await db.mass.findFirst({
      where: { id, organizationId: session.user.organizationId },
      select: { id: true, date: true, time: true },
    });

    if (!existingMass) {
      return { success: false, message: "Mass not found" };
    }

    const updateData: any = {
      ...data,
    };

    if (data.date) updateData.date = parseMassDayInput(data.date);

    const targetDate = updateData.date ?? existingMass.date;
    const targetTime = updateData.time ?? existingMass.time;

    const duplicate = await db.mass.findFirst({
      where: {
        id: { not: id },
        organizationId: session.user.organizationId,
        date: {
          gte: toUtcDayStart(new Date(targetDate)),
          lte: toUtcDayEnd(new Date(targetDate)),
        },
        time: targetTime,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });

    if (duplicate) {
      return {
        success: false,
        message:
          "Another mass already exists at this time for the selected day.",
      };
    }

    const mass = await db.mass.update({
      where: { id, organizationId: session.user.organizationId },
      data: updateData,
    });

    revalidatePath("/masses");
    revalidatePath("/mass");
    revalidatePath(`/p/${session.user.organizationId}`);
    return {
      success: true,
      message: "Mass updated successfully",
      data: mass,
    };
  } catch (error) {
    console.error("Failed to update mass:", error);
    return { success: false, message: "Failed to update mass" };
  }
}

export async function deleteMass(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (
      !session ||
      !["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"].includes(
        session.user.role,
      )
    ) {
      return { success: false, message: "Unauthorized" };
    }

    // Check if there are intentions
    const mass = await db.mass.findUnique({
      where: { id, organizationId: session.user.organizationId },
      include: { _count: { select: { intentions: true } } },
    });

    if (!mass) return { success: false, message: "Mass not found" };

    if (mass._count.intentions > 0) {
      return {
        success: false,
        message:
          "Cannot delete mass with existing intentions. Cancel it instead.",
      };
    }

    await db.mass.delete({
      where: { id },
    });

    revalidatePath("/masses");
    revalidatePath("/mass");
    revalidatePath(`/p/${session.user.organizationId}`);
    return { success: true, message: "Mass deleted successfully" };
  } catch (error) {
    console.error("Failed to delete mass:", error);
    return { success: false, message: "Failed to delete mass" };
  }
}

export async function getMassDays(
  startDate: Date | string,
  endDate: Date | string,
  organizationId?: string,
): Promise<ActionResponse<string[]>> {
  try {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized" };

    const targetOrgId = organizationId || session.user.organizationId;

    const start = toUtcDayStart(parseMassDayInput(startDate));
    const end = toUtcDayEnd(parseMassDayInput(endDate));

    const masses = await db.mass.findMany({
      where: {
        organizationId: targetOrgId,
        date: {
          gte: start,
          lte: end,
        },
        status: { not: "CANCELLED" },
      },
      select: { date: true },
    });

    // Extract unique dates as ISO strings (YYYY-MM-DD format)
    const dates = Array.from(new Set(masses.map((m) => m.date.toISOString().slice(0, 10))));

    return { success: true, message: "Mass days retrieved", data: dates };
  } catch (error) {
    console.error("Failed to get mass days:", error);
    return { success: false, message: "Failed to get mass days" };
  }
}
