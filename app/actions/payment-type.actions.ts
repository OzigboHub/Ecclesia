"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import {
  createPaymentTypeSchema,
  updatePaymentTypeSchema,
  massPaymentTypesSchema,
} from "@/lib/validators/payment-type.schema";
import type { ActionResponse } from "@/types";

const PAYMENT_TYPE_MANAGE_ROLES = [
  "SUPER_ADMIN",
  "PARISH_ADMIN",
  "PARISH_SECRETARY",
];

// ============================================
// PAYMENT TYPE CRUD
// ============================================

export async function getPaymentTypes(
  organizationId?: string,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    const targetOrgId = organizationId || session?.user?.organizationId;
    if (!targetOrgId) {
      return { success: false, message: "Organization context required" };
    }

    const paymentTypes = await db.paymentType.findMany({
      where: { organizationId: targetOrgId },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return {
      success: true,
      message: "Payment types retrieved",
      data: paymentTypes,
    };
  } catch (error) {
    console.error("Failed to get payment types:", error);
    return { success: false, message: "Failed to retrieve payment types" };
  }
}

export async function getActivePaymentTypes(
  organizationId?: string,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    const targetOrgId = organizationId || session?.user?.organizationId;
    if (!targetOrgId) {
      return { success: false, message: "Organization context required" };
    }

    const paymentTypes = await db.paymentType.findMany({
      where: { organizationId: targetOrgId, isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return {
      success: true,
      message: "Active payment types retrieved",
      data: paymentTypes,
    };
  } catch (error) {
    console.error("Failed to get active payment types:", error);
    return { success: false, message: "Failed to retrieve payment types" };
  }
}

export async function getPaymentType(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    const paymentType = await db.paymentType.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    if (!paymentType) {
      return { success: false, message: "Payment type not found" };
    }

    return {
      success: true,
      message: "Payment type retrieved",
      data: paymentType,
    };
  } catch (error) {
    console.error("Failed to get payment type:", error);
    return { success: false, message: "Failed to retrieve payment type" };
  }
}

export async function createPaymentType(
  formData: unknown,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!PAYMENT_TYPE_MANAGE_ROLES.includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" };
    }

    const parsed = createPaymentTypeSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const existing = await db.paymentType.findUnique({
      where: {
        name_organizationId: {
          name: parsed.data.name,
          organizationId: session.user.organizationId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: "A payment type with this name already exists",
      };
    }

    const paymentType = await db.paymentType.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
      },
    });

    revalidatePath("/payments/types");
    return {
      success: true,
      message: "Payment type created successfully",
      data: paymentType,
    };
  } catch (error) {
    console.error("Failed to create payment type:", error);
    return { success: false, message: "Failed to create payment type" };
  }
}

export async function updatePaymentType(
  id: string,
  formData: unknown,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!PAYMENT_TYPE_MANAGE_ROLES.includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" };
    }

    const parsed = updatePaymentTypeSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const existing = await db.paymentType.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!existing) {
      return { success: false, message: "Payment type not found" };
    }

    // Check name uniqueness if name is being changed
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const nameConflict = await db.paymentType.findUnique({
        where: {
          name_organizationId: {
            name: parsed.data.name,
            organizationId: session.user.organizationId,
          },
        },
      });
      if (nameConflict) {
        return {
          success: false,
          message: "A payment type with this name already exists",
        };
      }
    }

    const paymentType = await db.paymentType.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/payments/types");
    return {
      success: true,
      message: "Payment type updated successfully",
      data: paymentType,
    };
  } catch (error) {
    console.error("Failed to update payment type:", error);
    return { success: false, message: "Failed to update payment type" };
  }
}

export async function deletePaymentType(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!PAYMENT_TYPE_MANAGE_ROLES.includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" };
    }

    const existing = await db.paymentType.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: { _count: { select: { payments: true } } },
    });

    if (!existing) {
      return { success: false, message: "Payment type not found" };
    }

    if (existing._count.payments > 0) {
      // Soft-delete: deactivate instead of deleting if payments exist
      await db.paymentType.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: true,
        message:
          "Payment type has existing payments and was deactivated instead of deleted",
      };
    }

    await db.paymentType.delete({ where: { id } });

    revalidatePath("/payments/types");
    return {
      success: true,
      message: "Payment type deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete payment type:", error);
    return { success: false, message: "Failed to delete payment type" };
  }
}

// ============================================
// MASS ↔ PAYMENT TYPE LINKING
// ============================================

export async function getMassPaymentTypes(
  massId: string,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    const orgId = session?.user?.organizationId;

    const mass = await db.mass.findFirst({
      where: { id: massId, ...(orgId ? { organizationId: orgId } : {}) },
      include: {
        MassPaymentType: {
          include: {
            paymentType: true,
          },
        },
      },
    });

    if (!mass) {
      return { success: false, message: "Mass not found" };
    }

    const paymentTypes = mass.MassPaymentType.map((mpt) => mpt.paymentType);

    return {
      success: true,
      message: "Mass payment types retrieved",
      data: paymentTypes,
    };
  } catch (error) {
    console.error("Failed to get mass payment types:", error);
    return { success: false, message: "Failed to retrieve mass payment types" };
  }
}

export async function setMassPaymentTypes(
  formData: unknown,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!PAYMENT_TYPE_MANAGE_ROLES.includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" };
    }

    const parsed = massPaymentTypesSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Verify mass belongs to organization
    const mass = await db.mass.findFirst({
      where: {
        id: parsed.data.massId,
        organizationId: session.user.organizationId,
      },
    });

    if (!mass) {
      return { success: false, message: "Mass not found" };
    }

    // Replace all links in a transaction
    await db.$transaction([
      db.massPaymentType.deleteMany({
        where: { massId: parsed.data.massId },
      }),
      ...parsed.data.paymentTypeIds.map((paymentTypeId) =>
        db.massPaymentType.create({
          data: {
            massId: parsed.data.massId,
            paymentTypeId,
          },
        }),
      ),
    ]);

    revalidatePath("/masses");
    return {
      success: true,
      message: "Mass payment types updated",
    };
  } catch (error) {
    console.error("Failed to set mass payment types:", error);
    return { success: false, message: "Failed to update mass payment types" };
  }
}

// ============================================
// DEFAULT PAYMENT TYPES FOR SUNDAY MASSES
// ============================================

const DEFAULT_SUNDAY_PAYMENT_TYPES = [
  { name: "Sunday Offering", category: "OFFERING" as const },
  { name: "Sunday Thanksgiving", category: "OFFERING" as const },
];

/**
 * Ensures "Sunday Offering" and "Sunday Thanksgiving" payment types exist
 * for the given organization. Creates them if missing. Returns their IDs.
 */
export async function ensureDefaultPaymentTypes(
  organizationId: string,
): Promise<string[]> {
  const ids: string[] = [];

  for (const defaults of DEFAULT_SUNDAY_PAYMENT_TYPES) {
    let pt = await db.paymentType.findUnique({
      where: {
        name_organizationId: {
          name: defaults.name,
          organizationId,
        },
      },
    });

    if (!pt) {
      // Find an admin user to be the creator
      const adminUser = await db.user.findFirst({
        where: {
          organizationId,
          role: { in: ["PARISH_ADMIN", "SUPER_ADMIN"] },
        },
        select: { id: true },
      });

      pt = await db.paymentType.create({
        data: {
          name: defaults.name,
          description: `Default ${defaults.name.toLowerCase()} for Sunday services`,
          category: defaults.category,
          organizationId,
          createdById: adminUser?.id ?? "system",
        },
      });
    }

    // Ensure active
    if (!pt.isActive) {
      await db.paymentType.update({
        where: { id: pt.id },
        data: { isActive: true },
      });
    }

    ids.push(pt.id);
  }

  return ids;
}

/**
 * Auto-assign default payment types to Sunday masses that don't have them yet.
 * Called when masses are generated or when loading the mass calendar.
 */
export async function assignDefaultPaymentTypesToSundayMasses(
  organizationId: string,
): Promise<ActionResponse> {
  try {
    const defaultIds = await ensureDefaultPaymentTypes(organizationId);
    if (defaultIds.length === 0) {
      return { success: true, message: "No defaults to assign" };
    }

    // Find Sunday masses that are missing any default payment type links
    const sundayMasses = await db.mass.findMany({
      where: {
        organizationId,
        massType: "SUNDAY_MASS",
        status: { not: "CANCELLED" },
      },
      include: {
        MassPaymentType: { select: { paymentTypeId: true } },
      },
    });

    let assignedCount = 0;
    for (const mass of sundayMasses) {
      const existingPtIds = new Set(
        mass.MassPaymentType.map((mpt) => mpt.paymentTypeId),
      );
      const missingIds = defaultIds.filter((id) => !existingPtIds.has(id));

      if (missingIds.length > 0) {
        await db.massPaymentType.createMany({
          data: missingIds.map((paymentTypeId) => ({
            massId: mass.id,
            paymentTypeId,
          })),
          skipDuplicates: true,
        });
        assignedCount++;
      }
    }

    return {
      success: true,
      message: `Assigned defaults to ${assignedCount} Sunday masses`,
    };
  } catch (error) {
    console.error("Failed to assign default payment types:", error);
    return {
      success: false,
      message: "Failed to assign default payment types",
    };
  }
}
