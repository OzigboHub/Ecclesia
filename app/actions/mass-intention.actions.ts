"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features.server";
import {
  canBookMassIntentions,
  canManageMassIntentions,
} from "@/lib/permissions";
import {
  createMassIntentionSchema,
  publicMassIntentionSchema,
  updateMassIntentionSchema,
} from "@/lib/validators/mass-intention.schema";
import type { ActionResponse } from "@/types";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type MassIntentionWithRelations = Prisma.MassIntentionGetPayload<{
  include: {
    parishioner: true;
    organization: true;
    mass: true;
  };
}>;

// ============================================
// READ OPERATIONS
// ============================================

export async function getMassIntentions(): Promise<
  ActionResponse<MassIntentionWithRelations[]>
> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    if (!canBookMassIntentions(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to book mass intentions",
      };
    }

    // Check feature toggle
    const enabled = await isFeatureEnabled(
      session.user.organizationId,
      "enableMassIntentions",
    );
    if (!enabled) {
      return {
        success: false,
        message: "Mass intentions feature is not enabled",
      };
    }

    const isParishioner = session.user.role === "PARISHIONER";

    const massIntentions = await db.massIntention.findMany({
      where: {
        organizationId: session.user.organizationId,
        // Parishioners only see their own intentions
        ...(isParishioner && session.user.parishionerId
          ? { parishionerId: session.user.parishionerId }
          : isParishioner
            ? { requestedBy: session.user.name ?? undefined }
            : {}),
      },
      include: {
        parishioner: true,
        organization: true,
        mass: true, // Include Mass details
      },
      orderBy: { mass: { date: "asc" } }, // Sort by related Mass date
    });

    return {
      success: true,
      message: "Mass intentions retrieved successfully",
      data: massIntentions,
    };
  } catch (error) {
    console.error("Failed to get mass intentions:", error);
    return {
      success: false,
      message: "Failed to retrieve mass intentions",
    };
  }
}

export async function getMassIntention(
  id: string,
): Promise<ActionResponse<MassIntentionWithRelations>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    const massIntention = await db.massIntention.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        parishioner: true,
        organization: true,
        mass: true,
      },
    });

    if (!massIntention) {
      return { success: false, message: "Mass intention not found" };
    }

    return {
      success: true,
      message: "Mass intention retrieved successfully",
      data: massIntention,
    };
  } catch (error) {
    console.error("Failed to get mass intention:", error);
    return { success: false, message: "Failed to retrieve mass intention" };
  }
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createMassIntention(
  formData: unknown,
): Promise<ActionResponse<MassIntentionWithRelations>> {
  try {
    // Authentication
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Feature toggle check
    const enabled = await isFeatureEnabled(
      session.user.organizationId,
      "enableMassIntentions",
    );
    if (!enabled) {
      return {
        success: false,
        message: "Mass intentions feature is not enabled",
      };
    }

    // Validation with Zod
    const parsed = createMassIntentionSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { massId, parishionerId, stipend, ...rest } = parsed.data;

    // For parishioners, resolve their parishioner record
    let linkedParishionerId: string | undefined;
    if (session.user.role === "PARISHIONER") {
      linkedParishionerId = session.user.parishionerId ?? undefined;

      // Fallback: look up by email if session doesn't have it (e.g. registered before fix)
      if (!linkedParishionerId && session.user.email) {
        const parishioner = await db.parishioner.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        linkedParishionerId = parishioner?.id;
      }

      // Last resort: auto-create a parishioner record from the user profile
      if (!linkedParishionerId && session.user.email) {
        const user = await db.user.findUnique({
          where: { email: session.user.email },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            dateOfBirth: true,
            organizationId: true,
          },
        });
        if (user) {
          const newParishioner = await db.parishioner.create({
            data: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              address: user.address,
              dateOfBirth: user.dateOfBirth,
              organizationId: user.organizationId,
            },
          });
          linkedParishionerId = newParishioner.id;
        }
      }

      if (!linkedParishionerId) {
        return {
          success: false,
          message:
            "Your account is not linked to a parishioner record yet. Contact the parish office.",
        };
      }
    } else {
      linkedParishionerId = parishionerId ?? undefined;
    }

    // Verify Mass exists and belongs to organization
    const mass = await db.mass.findUnique({
      where: { id: massId },
      include: { _count: { select: { intentions: true } } },
    });

    if (!mass || mass.organizationId !== session.user.organizationId) {
      return { success: false, message: "Invalid Mass selected" };
    }

    if (mass.status === "CANCELLED") {
      return {
        success: false,
        message: "Selected Mass has been cancelled",
      };
    }

    // Create mass intention with optional payment
    const result = await db.$transaction(async (tx) => {
      // Create mass intention
      const massIntention = await tx.massIntention.create({
        data: {
          ...rest,
          massId, // Link to Mass
          organizationId: session.user.organizationId,
          ...(linkedParishionerId && {
            parishionerId: linkedParishionerId,
          }),
          status: "PENDING",
        },
        include: {
          parishioner: true,
          organization: true,
          mass: true,
        },
      });

      // Create payment record if stipend provided
      if (stipend && stipend > 0) {
        await tx.payment.create({
          data: {
            amount: stipend,
            purpose: "MASS_INTENTION",
            paymentMethod: "CASH",
            paymentStatus: "COMPLETED",
            payerName: rest.requestedBy || "Anonymous",
            organizationId: session.user.organizationId,
            recordedById: session.user.id,
            ...(linkedParishionerId && {
              parishionerId: linkedParishionerId,
            }),
            massIntentionId: massIntention.id,
            notes: `Stipend for mass intention: ${rest.intention}`,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "MASS_INTENTION_BOOKED",
          entityType: "MassIntention",
          entityId: massIntention.id,
          performedBy: session.user.id,
          details: {
            intention: massIntention.intention,
            requestedBy: massIntention.requestedBy,
            massId: massIntention.massId,
            stipend: stipend || 0,
          },
        },
      });

      return massIntention;
    });

    revalidatePath("/mass-intentions");
    revalidatePath("/mass-intentions/calendar");
    revalidatePath("/masses");
    revalidatePath("/dashboard/mass-intentions");
    revalidatePath("/dashboard/payments");

    return {
      success: true,
      message:
        "Mass intention scheduled successfully" +
        (stipend && stipend > 0
          ? ` and payment recorded (₦${stipend.toLocaleString("en-NG")})`
          : ""),
      data: result,
    };
  } catch (error) {
    console.error("Failed to create mass intention:", error);
    return { success: false, message: "Failed to schedule mass intention" };
  }
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateMassIntention(
  id: string,
  formData: unknown,
): Promise<ActionResponse<MassIntentionWithRelations>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Authorization - staff roles can update mass intentions
    if (!canManageMassIntentions(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to update mass intentions",
      };
    }

    // Validation
    const parsed = updateMassIntentionSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Verify ownership
    const existing = await db.massIntention.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return { success: false, message: "Mass intention not found" };
    }

    // Build update data
    const updateData: Prisma.MassIntentionUpdateInput = {};

    if (parsed.data.intention !== undefined)
      updateData.intention = parsed.data.intention;
    if (parsed.data.intentionType !== undefined)
      updateData.intentionType = parsed.data.intentionType;
    if (parsed.data.requestedBy !== undefined)
      updateData.requestedBy = parsed.data.requestedBy;
    if (parsed.data.contactEmail !== undefined)
      updateData.contactEmail = parsed.data.contactEmail;
    if (parsed.data.contactPhone !== undefined)
      updateData.contactPhone = parsed.data.contactPhone;
    if (parsed.data.stipend !== undefined)
      updateData.stipend = parsed.data.stipend;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    // Handle mass relationship
    if (parsed.data.massId) {
      // Validate new mass if changing
      const mass = await db.mass.findUnique({
        where: { id: parsed.data.massId },
      });
      if (!mass || mass.organizationId !== session.user.organizationId) {
        return {
          success: false,
          message: "Invalid Mass for this organization",
        };
      }
      updateData.mass = { connect: { id: parsed.data.massId } };
    }

    // Handle parishioner relation
    if (parsed.data.parishionerId !== undefined) {
      if (parsed.data.parishionerId) {
        updateData.parishioner = {
          connect: { id: parsed.data.parishionerId },
        };
      } else {
        updateData.parishioner = { disconnect: true };
      }
    }

    // Update
    const massIntention = await db.massIntention.update({
      where: { id },
      data: updateData,
      include: {
        parishioner: true,
        organization: true,
        mass: true,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "MassIntention",
        entityId: id,
        performedBy: session.user.id,
        details: {
          updatedFields: Object.keys(parsed.data),
        },
      },
    });

    revalidatePath("/mass-intentions");
    revalidatePath("/mass-intentions/calendar");
    revalidatePath("/dashboard/mass-intentions");
    revalidatePath(`/dashboard/mass-intentions/${id}`);

    return {
      success: true,
      message: "Mass intention updated successfully",
      data: massIntention,
    };
  } catch (error) {
    console.error("Failed to update mass intention:", error);
    return { success: false, message: "Failed to update mass intention" };
  }
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function deleteMassIntention(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can delete
    if (!["SUPER_ADMIN", "PARISH_ADMIN"].includes(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to delete mass intentions",
      };
    }

    // Verify ownership
    const existing = await db.massIntention.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return { success: false, message: "Mass intention not found" };
    }

    await db.massIntention.delete({ where: { id } });

    // Audit Log
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "MassIntention",
        entityId: id,
        performedBy: session.user.id,
        details: {
          intention: existing.intention,
          requestedBy: existing.requestedBy,
        },
      },
    });

    revalidatePath("/mass-intentions");
    revalidatePath("/mass-intentions/calendar");
    revalidatePath("/dashboard/mass-intentions");

    return {
      success: true,
      message: "Mass intention deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete mass intention:", error);
    return { success: false, message: "Failed to delete mass intention" };
  }
}

// ============================================
// PUBLIC OPERATIONS (no auth required)
// ============================================

export async function submitPublicMassIntention(
  organizationId: string,
  formData: unknown,
): Promise<ActionResponse> {
  try {
    const parsed = publicMassIntentionSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
      },
    });

    if (!organization) {
      return { success: false, message: "Organization not found" };
    }

    const enabled = await isFeatureEnabled(organizationId, "enableMassIntentions");
    if (!enabled) {
      return {
        success: false,
        message: "Mass intentions are not available for this parish",
      };
    }

    const { massId, stipend, ...rest } = parsed.data;

    // Verify mass exists and belongs to the organization
    const mass = await db.mass.findUnique({
      where: { id: massId },
    });

    if (!mass || mass.organizationId !== organizationId) {
      return { success: false, message: "Invalid Mass selected" };
    }

    if (mass.status === "CANCELLED") {
      return {
        success: false,
        message: "Selected Mass has been cancelled",
      };
    }

    const massIntention = await db.massIntention.create({
      data: {
        ...rest,
        massId,
        organizationId,
        status: "PENDING",
      },
    });

    revalidatePath(`/p/${organizationId}/mass-intentions`);
    revalidatePath("/dashboard/mass-intentions");

    return {
      success: true,
      message: "Mass intention submitted successfully. The parish will review your request.",
    };
  } catch (error) {
    console.error("Failed to submit public mass intention:", error);
    return { success: false, message: "Failed to submit mass intention" };
  }
}
