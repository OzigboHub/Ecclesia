"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { canManageFinancials } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/features.server";
import {
  createParishFinancialEntrySchema,
  updateParishFinancialEntrySchema,
  ENTRY_TYPE_LABELS,
  type ParishFinancialEntryType,
} from "@/lib/validators/parish-financial.schema";
import type { ActionResponse } from "@/types";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type FinancialEntryWithRelations = Prisma.ParishFinancialEntryGetPayload<{
  include: {
    organization: true;
    recordedBy: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

// ============================================
// HELPER
// ============================================

function getEntryTitle(
  entryType: ParishFinancialEntryType,
  customTitle?: string | null,
): string {
  if (entryType === "OTHER" && customTitle) {
    return customTitle;
  }
  return ENTRY_TYPE_LABELS[entryType] || entryType;
}

// ============================================
// READ OPERATIONS
// ============================================

export async function getParishFinancialEntries(params?: {
  page?: number;
  limit?: number;
  search?: string;
  entryType?: ParishFinancialEntryType;
  startDate?: string;
  endDate?: string;
}): Promise<
  ActionResponse<{
    entries: FinancialEntryWithRelations[];
    total: number;
  }>
> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageFinancials(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to view financial entries",
      };
    }

    const enabled = await isFeatureEnabled(
      session.user.organizationId,
      "enableFinancialManagement",
    );
    if (!enabled) {
      return {
        success: false,
        message: "Financial management is not enabled",
      };
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ParishFinancialEntryWhereInput = {
      organizationId: session.user.organizationId,
      ...(params?.entryType && { entryType: params.entryType }),
      ...(params?.startDate || params?.endDate
        ? {
            date: {
              ...(params?.startDate && {
                gte: new Date(params.startDate),
              }),
              ...(params?.endDate && {
                lte: new Date(params.endDate + "T23:59:59.999Z"),
              }),
            },
          }
        : {}),
      ...(params?.search && {
        OR: [
          { title: { contains: params.search, mode: "insensitive" as const } },
          {
            customTitle: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
          { notes: { contains: params.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [entries, total] = await Promise.all([
      db.parishFinancialEntry.findMany({
        where,
        include: {
          organization: true,
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.parishFinancialEntry.count({ where }),
    ]);

    return {
      success: true,
      message: "Financial entries retrieved successfully",
      data: { entries, total },
    };
  } catch (error) {
    console.error("Failed to get financial entries:", error);
    return {
      success: false,
      message: "Failed to retrieve financial entries",
    };
  }
}

export async function getParishFinancialEntry(
  id: string,
): Promise<ActionResponse<FinancialEntryWithRelations>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    const entry = await db.parishFinancialEntry.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        organization: true,
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!entry) {
      return { success: false, message: "Financial entry not found" };
    }

    return {
      success: true,
      message: "Financial entry retrieved",
      data: entry,
    };
  } catch (error) {
    console.error("Failed to get financial entry:", error);
    return { success: false, message: "Failed to retrieve financial entry" };
  }
}

// ============================================
// STATS
// ============================================

export async function getParishFinancialStats(): Promise<
  ActionResponse<{
    totalEntries: number;
    totalAmount: number;
    byType: { entryType: string; count: number; total: number }[];
  }>
> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageFinancials(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to view financial stats",
      };
    }

    const orgId = session.user.organizationId;

    const [totalEntries, aggregation, byType] = await Promise.all([
      db.parishFinancialEntry.count({
        where: { organizationId: orgId },
      }),
      db.parishFinancialEntry.aggregate({
        where: { organizationId: orgId },
        _sum: { amount: true },
      }),
      db.parishFinancialEntry.groupBy({
        by: ["entryType"],
        where: { organizationId: orgId },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      success: true,
      message: "Stats retrieved",
      data: {
        totalEntries,
        totalAmount: aggregation._sum.amount ?? 0,
        byType: byType.map((b) => ({
          entryType: b.entryType,
          count: b._count,
          total: b._sum.amount ?? 0,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to get financial stats:", error);
    return { success: false, message: "Failed to retrieve financial stats" };
  }
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createParishFinancialEntry(
  formData: unknown,
): Promise<ActionResponse<FinancialEntryWithRelations>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageFinancials(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to create financial entries",
      };
    }

    const enabled = await isFeatureEnabled(
      session.user.organizationId,
      "enableFinancialManagement",
    );
    if (!enabled) {
      return {
        success: false,
        message: "Financial management is not enabled",
      };
    }

    const parsed = createParishFinancialEntrySchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { entryType, customTitle, amount, date, notes } = parsed.data;
    const title = getEntryTitle(
      entryType as ParishFinancialEntryType,
      customTitle,
    );

    const entry = await db.$transaction(async (tx) => {
      const created = await tx.parishFinancialEntry.create({
        data: {
          entryType: entryType as any,
          title,
          customTitle: entryType === "OTHER" ? customTitle : null,
          amount,
          date: new Date(date),
          notes: notes || null,
          organizationId: session.user.organizationId,
          recordedById: session.user.id,
        },
        include: {
          organization: true,
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "FINANCIAL_ENTRY_RECORDED",
          entityType: "ParishFinancialEntry",
          entityId: created.id,
          performedBy: session.user.id,
          details: {
            title,
            entryType,
            amount,
            date,
            recordedBy: `${session.user.name}`,
          },
        },
      });

      return created;
    });

    revalidatePath("/parish-finances");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Financial entry "${title}" recorded successfully`,
      data: entry,
    };
  } catch (error) {
    console.error("Failed to create financial entry:", error);
    return { success: false, message: "Failed to create financial entry" };
  }
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateParishFinancialEntry(
  id: string,
  formData: unknown,
): Promise<ActionResponse<FinancialEntryWithRelations>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canManageFinancials(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to update financial entries",
      };
    }

    const existing = await db.parishFinancialEntry.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return { success: false, message: "Financial entry not found" };
    }

    const parsed = updateParishFinancialEntrySchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const updateData: Prisma.ParishFinancialEntryUpdateInput = {};

    if (parsed.data.entryType !== undefined) {
      updateData.entryType = parsed.data.entryType as any;
      updateData.title = getEntryTitle(
        parsed.data.entryType as ParishFinancialEntryType,
        parsed.data.customTitle,
      );
      updateData.customTitle =
        parsed.data.entryType === "OTHER" ? parsed.data.customTitle : null;
    }
    if (parsed.data.amount !== undefined)
      updateData.amount = parsed.data.amount;
    if (parsed.data.date !== undefined)
      updateData.date = new Date(parsed.data.date);
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const entry = await db.parishFinancialEntry.update({
      where: { id },
      data: updateData,
      include: {
        organization: true,
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/parish-finances");

    return {
      success: true,
      message: "Financial entry updated successfully",
      data: entry,
    };
  } catch (error) {
    console.error("Failed to update financial entry:", error);
    return { success: false, message: "Failed to update financial entry" };
  }
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function deleteParishFinancialEntry(
  id: string,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!["SUPER_ADMIN", "PARISH_ADMIN"].includes(session.user.role)) {
      return {
        success: false,
        message: "Only administrators can delete financial entries",
      };
    }

    const existing = await db.parishFinancialEntry.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return { success: false, message: "Financial entry not found" };
    }

    await db.parishFinancialEntry.delete({ where: { id } });

    revalidatePath("/parish-finances");

    return {
      success: true,
      message: "Financial entry deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete financial entry:", error);
    return { success: false, message: "Failed to delete financial entry" };
  }
}
