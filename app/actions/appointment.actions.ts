"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentFilterSchema,
  type AppointmentFilter,
} from "@/lib/validators/appointment.schema";
import type { ActionResponse } from "@/types";
import { Prisma } from "@prisma/client";
import {
  canBypassFeatureToggle,
  isFeatureEnabledForRole,
} from "@/lib/features.server";

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    assignedTo: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
    parishioner: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        phone: true;
      };
    };
    requestedBy: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

type AppointmentBookingWindow = {
  appointmentBookingOpensAt: Date | null;
  appointmentBookingClosesAt: Date | null;
};

async function withDbRetry<T>(
  operation: () => Promise<T>,
  options?: { attempts?: number; baseDelayMs?: number },
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 150;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const maybeAny = error as any;
      const message =
        typeof maybeAny?.message === "string" ? maybeAny.message : "";

      const isTransientPrismaError =
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          ["P1000", "P1001", "P1002", "P1008", "P1017"].includes(
            (error as any).code,
          ));

      const isLikelyNetworkError =
        maybeAny?.name === "ErrorEvent" ||
        message.toLowerCase().includes("websocket") ||
        message.toLowerCase().includes("socket") ||
        message.toLowerCase().includes("econnreset") ||
        message.toLowerCase().includes("etimedout") ||
        message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("network");

      const shouldRetry = isTransientPrismaError || isLikelyNetworkError;
      if (!shouldRetry || attempt === attempts) {
        throw error;
      }

      const delayMs = baseDelayMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// ============================================
// READ OPERATIONS
// ============================================

export async function getAppointments(): Promise<
  ActionResponse<AppointmentWithRelations[]>
> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Check feature toggle
    const enabled = await isFeatureEnabledForRole(
      session.user.organizationId,
      "enableAppointments",
      session.user.role,
    );
    if (!enabled) {
      return {
        success: false,
        message: "Appointments feature is not enabled",
      };
    }

    const appointments = await withDbRetry(() =>
      db.appointment.findMany({
        where: { organizationId: session.user.organizationId },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          parishioner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
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
        orderBy: { startTime: "asc" },
      }),
    );

    return {
      success: true,
      message: "Appointments retrieved successfully",
      data: appointments,
    };
  } catch (error) {
    console.error("Failed to get appointments:", error);
    return {
      success: false,
      message: "Failed to retrieve appointments. Please refresh and try again.",
    };
  }
}

/**
 * Get appointments with filters and pagination
 */
export async function getAppointmentsFiltered(
  query?: Partial<AppointmentFilter>,
): Promise<
  ActionResponse<{ appointments: AppointmentWithRelations[]; total: number }>
> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Check feature toggle
    const enabled = await isFeatureEnabledForRole(
      session.user.organizationId,
      "enableAppointments",
      session.user.role,
    );
    if (!enabled) {
      return {
        success: false,
        message: "Appointments feature is not enabled",
      };
    }

    // Parse and validate query (never throw)
    const parsedResult = appointmentFilterSchema.safeParse(query || {});
    if (!parsedResult.success) {
      return {
        success: false,
        message: "Invalid appointment filters",
        errors: parsedResult.error.flatten().fieldErrors,
      };
    }
    const {
      page,
      limit,
      search,
      type,
      status,
      assignedToId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = parsedResult.data;

    // Build where clause
    const where: Prisma.AppointmentWhereInput = {
      organizationId: session.user.organizationId,
      ...(type && { type }),
      ...(status && { status }),
      ...(assignedToId && { assignedToId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          {
            parishioner: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ],
      }),
      ...(dateFrom &&
        dateTo && {
          startTime: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
    };

    // Execute queries in parallel
    const [appointments, total] = await withDbRetry(() =>
      Promise.all([
        db.appointment.findMany({
          where,
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            parishioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
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
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.appointment.count({ where }),
      ]),
    );

    return {
      success: true,
      message: "Appointments retrieved successfully",
      data: { appointments, total },
    };
  } catch (error) {
    console.error("Failed to get appointments:", error);
    return {
      success: false,
      message: "Failed to retrieve appointments. Please refresh and try again.",
    };
  }
}

export async function getAppointment(
  id: string,
): Promise<ActionResponse<AppointmentWithRelations>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    const appointment = await db.appointment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        parishioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
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
    });

    if (!appointment) {
      return { success: false, message: "Appointment not found" };
    }

    return {
      success: true,
      message: "Appointment retrieved",
      data: appointment,
    };
  } catch (error) {
    console.error("Failed to get appointment:", error);
    return { success: false, message: "Failed to retrieve appointment" };
  }
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createAppointment(
  formData: unknown,
): Promise<ActionResponse<AppointmentWithRelations>> {
  try {
    // Authentication
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Authorization - staff roles can create appointments
    const allowedRoles = [
      "SUPER_ADMIN",
      "PARISH_ADMIN",
      "PARISH_SECRETARY",
      "PARISH_STAFF",
      "OUTSTATION_ADMIN",
    ];
    if (!allowedRoles.includes(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to create appointments",
      };
    }

    // Feature toggle check
    const enabled = await isFeatureEnabledForRole(
      session.user.organizationId,
      "enableAppointments",
      session.user.role,
    );
    if (!enabled) {
      return {
        success: false,
        message: "Appointments feature is not enabled",
      };
    }

    // Validation with Zod
    const parsed = createAppointmentSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { startTime, endTime, notes, ...rest } = parsed.data;
    const startAt = new Date(startTime);

    if (!canBypassFeatureToggle(session.user.role)) {
      const organization = await db.organization.findUnique({
        where: { id: session.user.organizationId },
        select: {
          appointmentBookingOpensAt: true,
          appointmentBookingClosesAt: true,
        },
      });

      if (
        organization?.appointmentBookingOpensAt &&
        startAt < organization.appointmentBookingOpensAt
      ) {
        return {
          success: false,
          message:
            "Appointment booking is currently closed for this date range",
        };
      }

      if (
        organization?.appointmentBookingClosesAt &&
        startAt > organization.appointmentBookingClosesAt
      ) {
        return {
          success: false,
          message:
            "Appointment booking is currently closed for this date range",
        };
      }
    }

    // Combine description and notes if both exist
    let finalDescription = rest.description || "";
    if (notes) {
      finalDescription = finalDescription
        ? `${finalDescription}\n\nAdditional Notes: ${notes}`
        : notes;
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        ...rest,
        description: finalDescription || null,
        startTime: startAt,
        endTime: new Date(endTime),
        organizationId: session.user.organizationId,
        requestedById: session.user.id,
        status: "PENDING",
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        parishioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
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
    });

    revalidatePath("/dashboard/appointments");

    return {
      success: true,
      message: "Appointment scheduled successfully",
      data: appointment,
    };
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return { success: false, message: "Failed to schedule appointment" };
  }
}

export async function getAppointmentBookingWindow(): Promise<
  ActionResponse<AppointmentBookingWindow>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        appointmentBookingOpensAt: true,
        appointmentBookingClosesAt: true,
      },
    });

    if (!organization) {
      return { success: false, message: "Organization not found" };
    }

    return {
      success: true,
      message: "Appointment booking window retrieved",
      data: {
        appointmentBookingOpensAt: organization.appointmentBookingOpensAt,
        appointmentBookingClosesAt: organization.appointmentBookingClosesAt,
      },
    };
  } catch (error) {
    console.error("Failed to get appointment booking window:", error);
    return { success: false, message: "Failed to retrieve booking window" };
  }
}

export async function setAppointmentBookingWindow(params: {
  appointmentBookingOpensAt?: string | Date | null;
  appointmentBookingClosesAt?: string | Date | null;
}): Promise<ActionResponse<AppointmentBookingWindow>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, message: "Permission denied" };
    }

    const opensAt = params.appointmentBookingOpensAt
      ? new Date(params.appointmentBookingOpensAt)
      : null;
    const closesAt = params.appointmentBookingClosesAt
      ? new Date(params.appointmentBookingClosesAt)
      : null;

    if (opensAt && closesAt && closesAt < opensAt) {
      return {
        success: false,
        message: "Booking close date cannot be earlier than open date",
      };
    }

    const updated = await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        appointmentBookingOpensAt: opensAt,
        appointmentBookingClosesAt: closesAt,
      },
      select: {
        appointmentBookingOpensAt: true,
        appointmentBookingClosesAt: true,
      },
    });

    revalidatePath("/dashboard/appointments");

    return {
      success: true,
      message: "Appointment booking window updated",
      data: {
        appointmentBookingOpensAt: updated.appointmentBookingOpensAt,
        appointmentBookingClosesAt: updated.appointmentBookingClosesAt,
      },
    };
  } catch (error) {
    console.error("Failed to update appointment booking window:", error);
    return { success: false, message: "Failed to update booking window" };
  }
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateAppointment(
  id: string,
  formData: unknown,
): Promise<ActionResponse<AppointmentWithRelations>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Authorization
    const allowedRoles = [
      "SUPER_ADMIN",
      "PARISH_ADMIN",
      "PARISH_SECRETARY",
      "PARISH_STAFF",
      "OUTSTATION_ADMIN",
    ];
    if (!allowedRoles.includes(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to update appointments",
      };
    }

    // Validation
    const parsed = updateAppointmentSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Verify ownership
    const existing = await db.appointment.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return { success: false, message: "Appointment not found" };
    }

    // Build update data properly
    const updateData: Prisma.AppointmentUpdateInput = {};

    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;

    // Handle description and notes - combine them if notes is provided
    if (
      parsed.data.description !== undefined ||
      parsed.data.notes !== undefined
    ) {
      let finalDescription =
        parsed.data.description ?? existing.description ?? "";
      if (parsed.data.notes) {
        finalDescription = finalDescription
          ? `${finalDescription}\n\nAdditional Notes: ${parsed.data.notes}`
          : parsed.data.notes;
      }
      updateData.description = finalDescription || null;
    }

    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.status !== undefined)
      updateData.status = parsed.data.status;

    // Handle date fields
    if (parsed.data.startTime) {
      updateData.startTime = new Date(parsed.data.startTime);
    }
    if (parsed.data.endTime) {
      updateData.endTime = new Date(parsed.data.endTime);
    }

    // Handle relations
    if (parsed.data.parishionerId) {
      updateData.parishioner = {
        connect: { id: parsed.data.parishionerId },
      };
    }
    if (parsed.data.assignedToId !== undefined) {
      if (parsed.data.assignedToId) {
        updateData.assignedTo = {
          connect: { id: parsed.data.assignedToId },
        };
      } else {
        updateData.assignedTo = { disconnect: true };
      }
    }

    // Update
    const appointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        parishioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
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
    });

    revalidatePath("/dashboard/appointments");
    revalidatePath(`/dashboard/appointments/${id}`);

    return {
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    };
  } catch (error) {
    console.error("Failed to update appointment:", error);
    return { success: false, message: "Failed to update appointment" };
  }
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function cancelAppointment(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Authorization - same roles as update
    const allowedRoles = [
      "SUPER_ADMIN",
      "PARISH_ADMIN",
      "PARISH_SECRETARY",
      "PARISH_STAFF",
      "OUTSTATION_ADMIN",
    ];
    if (!allowedRoles.includes(session.user.role)) {
      return {
        success: false,
        message: "You do not have permission to cancel appointments",
      };
    }

    // Verify ownership
    const existing = await db.appointment.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return { success: false, message: "Appointment not found" };
    }

    // Soft delete - mark as cancelled
    await db.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/dashboard/appointments");

    return {
      success: true,
      message: "Appointment cancelled successfully",
    };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    return { success: false, message: "Failed to cancel appointment" };
  }
}

export async function deleteAppointment(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can hard delete
    if (
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "PARISH_ADMIN"
    ) {
      return { success: false, message: "Permission denied" };
    }

    // Verify ownership
    const existing = await db.appointment.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return { success: false, message: "Appointment not found" };
    }

    await db.appointment.delete({ where: { id } });

    revalidatePath("/dashboard/appointments");

    return {
      success: true,
      message: "Appointment deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    return { success: false, message: "Failed to delete appointment" };
  }
}
