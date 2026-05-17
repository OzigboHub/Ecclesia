"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentQuerySchema,
  type PaymentQuery,
} from "@/lib/validators/payment.schema";
import type { ActionResponse } from "@/types";
import { Prisma } from "@prisma/client";
import { canBypassFeatureToggle } from "@/lib/features.server";

// Type for payment with relations
type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    parishioner: true;
    organization: true;
    recordedBy: true;
    massIntention: {
      include: {
        mass: true;
      };
    };
    donationCampaign: true;
  };
}>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a payment purpose is enabled for the organization
 */
async function checkFeatureEnabled(
  organizationId: string,
  purpose: string,
  role?: string,
): Promise<{ enabled: boolean; message?: string }> {
  if (canBypassFeatureToggle(role)) {
    return { enabled: true };
  }

  const settings = await db.organizationFeatureSettings.findUnique({
    where: { organizationId },
  });

  if (!settings) {
    return { enabled: true }; // Default enabled if no settings
  }

  const featureMap: Record<string, boolean> = {
    OFFERING: settings.enableOfferings,
    TITHE: settings.enableTithes,
    MASS_INTENTION: settings.enableMassIntentions,
    DONATION_CAMPAIGN: settings.enableDonationCampaigns,
    CUSTOM_DONATION: settings.enableCustomDonationTypes,
  };

  if (purpose in featureMap && !featureMap[purpose]) {
    const purposeName = purpose
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return {
      enabled: false,
      message: `${purposeName} payments are not enabled for your organization`,
    };
  }

  return { enabled: true };
}

async function isFinancialManagementEnabledForUser(
  organizationId: string,
  role?: string,
): Promise<boolean> {
  if (canBypassFeatureToggle(role)) {
    return true;
  }

  const settings = await db.organizationFeatureSettings.findUnique({
    where: { organizationId },
    select: { enableFinancialManagement: true },
  });

  return !!settings?.enableFinancialManagement;
}

/**
 * Generate unique receipt number
 */
async function generateReceiptNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RCP-${year}`;

  // Get the last receipt number for this year
  const lastPayment = await db.payment.findFirst({
    where: {
      organizationId,
      receiptNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      receiptNumber: "desc",
    },
    select: {
      receiptNumber: true,
    },
  });

  let nextNumber = 1;
  if (lastPayment?.receiptNumber) {
    const lastNumber = parseInt(
      lastPayment.receiptNumber.split("-").pop() || "0",
    );
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${nextNumber.toString().padStart(6, "0")}`;
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all payments with filters and pagination
 */
export async function getPayments(
  query?: Partial<PaymentQuery>,
): Promise<
  ActionResponse<{ payments: PaymentWithRelations[]; total: number }>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Financial Privacy: Only Admin, Secretary, and Super Admin can view financial records
    const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
    if (!allowedRoles.includes(session.user.role)) {
      return {
        success: false,
        message:
          "Access Denied: You do not have permission to view financial records",
      };
    }

    // Check if financial management is enabled
    const canUseFinancialModule = await isFinancialManagementEnabledForUser(
      session.user.organizationId,
      session.user.role,
    );
    if (!canUseFinancialModule) {
      return {
        success: false,
        message: "Financial management is not enabled",
      };
    }

    // Parse and validate query
    const parsed = paymentQuerySchema.parse(query || {});
    const {
      page,
      limit,
      search,
      purpose,
      status,
      method,
      parishionerId,
      month,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = parsed;

    // Build where clause (EVENT_PAYMENT is stored as OTHER in DB)
    const dbPurposeForQuery = purpose === "EVENT_PAYMENT" ? "OTHER" : purpose;
    const where: Prisma.PaymentWhereInput = {
      organizationId: session.user.organizationId,
      ...(dbPurposeForQuery && { purpose: dbPurposeForQuery }),
      ...(status && { paymentStatus: status }),
      ...(method && { paymentMethod: method }),
      ...(parishionerId && { parishionerId }),
      ...(month && { month }),
      ...(search && {
        OR: [
          { payerName: { contains: search, mode: "insensitive" } },
          {
            transactionRef: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            receiptNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(dateFrom &&
        dateTo && {
          paymentDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
    };

    // Execute queries in parallel
    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          parishioner: true,
          organization: true,
          recordedBy: true,
          massIntention: {
            include: {
              mass: true,
            },
          },
          donationCampaign: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);

    return {
      success: true,
      message: "Payments retrieved successfully",
      data: {
        payments,
        total,
      },
    };
  } catch (error) {
    console.error("Failed to get payments:", error);
    return { success: false, message: "Failed to retrieve payments" };
  }
}

/**
 * Get a single payment by ID
 */
export async function getPayment(
  id: string,
): Promise<ActionResponse<PaymentWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const payment = await db.payment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        parishioner: true,
        organization: true,
        recordedBy: true,
        massIntention: {
          include: {
            mass: true,
          },
        },
        donationCampaign: true,
      },
    });

    if (!payment) {
      return { success: false, message: "Payment not found" };
    }

    // Privacy Check: Parishioners can only see their own payments
    const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
    if (
      !allowedRoles.includes(session.user.role) &&
      payment.parishionerId !== session.user.parishionerId
    ) {
      return {
        success: false,
        message: "Access Denied: You can only view your own payment records",
      };
    }

    return {
      success: true,
      message: "Payment retrieved successfully",
      data: payment,
    };
  } catch (error) {
    console.error("Failed to get payment:", error);
    return { success: false, message: "Failed to retrieve payment" };
  }
}

/**
 * Get payment statistics for dashboard
 */
export async function getPaymentStats(): Promise<
  ActionResponse<{
    totalAmount: number;
    totalCount: number;
    byPurpose: Record<string, number>;
    byMonth: Record<number, number>;
    recentPayments: PaymentWithRelations[];
  }>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Financial Privacy
    const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, message: "Access Denied" };
    }

    const canUseFinancialModule = await isFinancialManagementEnabledForUser(
      session.user.organizationId,
      session.user.role,
    );
    if (!canUseFinancialModule) {
      return {
        success: false,
        message: "Financial management is not enabled",
      };
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Get total amount and count
    const [totalStats, byPurpose, byMonth, recentPayments] = await Promise.all([
      db.payment.aggregate({
        where: {
          organizationId: session.user.organizationId,
          paymentStatus: "COMPLETED",
          paymentDate: { gte: yearStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.groupBy({
        by: ["purpose"],
        where: {
          organizationId: session.user.organizationId,
          paymentStatus: "COMPLETED",
          paymentDate: { gte: yearStart },
        },
        _sum: { amount: true },
      }),
      db.payment.groupBy({
        by: ["month"],
        where: {
          organizationId: session.user.organizationId,
          paymentStatus: "COMPLETED",
          purpose: "OFFERING",
          paymentDate: { gte: yearStart },
        },
        _sum: { amount: true },
      }),
      db.payment.findMany({
        where: {
          organizationId: session.user.organizationId,
        },
        include: {
          parishioner: true,
          organization: true,
          recordedBy: true,
          massIntention: {
            include: {
              mass: true,
            },
          },
          donationCampaign: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const byPurposeMap: Record<string, number> = {};
    byPurpose.forEach((item) => {
      byPurposeMap[item.purpose] = item._sum.amount || 0;
    });

    const byMonthMap: Record<number, number> = {};
    byMonth.forEach((item) => {
      if (item.month) {
        byMonthMap[item.month] = item._sum.amount || 0;
      }
    });

    return {
      success: true,
      message: "Payment statistics retrieved",
      data: {
        totalAmount: totalStats._sum.amount || 0,
        totalCount: totalStats._count,
        byPurpose: byPurposeMap,
        byMonth: byMonthMap,
        recentPayments,
      },
    };
  } catch (error) {
    console.error("Failed to get payment stats:", error);
    return { success: false, message: "Failed to retrieve statistics" };
  }
}

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Record a new payment
 * Supports guest checkout for certain purposes and digital methods
 */
export async function createPayment(
  formData: unknown,
  organizationId?: string, // Required for guest checkout
): Promise<ActionResponse<PaymentWithRelations>> {
  try {
    const session = await auth();
    const parsed = createPaymentSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { purpose, paymentMethod, societyId, ...paymentData } = parsed.data;

    // 1. Determine Organization Scope
    const targetOrgId = organizationId || session?.user?.organizationId;
    if (!targetOrgId) {
      return { success: false, message: "Organization Context Required" };
    }

    // 2. Authentication & Authorization Check
    const isGuestCheckout =
      !session &&
      ["CARD", "MOBILE_MONEY", "BANK_TRANSFER"].includes(paymentMethod) &&
      [
        "DONATION_CAMPAIGN",
        "EVENT_PAYMENT",
        "MASS_INTENTION",
        "OTHER",
      ].includes(purpose);

    if (!session && !isGuestCheckout) {
      return {
        success: false,
        message: "Authentication required for this payment type",
      };
    }

    if (session) {
      // Role check for staff recording manual payments
      const staffRoles = [
        "SUPER_ADMIN",
        "PARISH_ADMIN",
        "PARISH_SECRETARY",
        "PARISH_STAFF",
      ];
      if (paymentMethod === "CASH" && !staffRoles.includes(session.user.role)) {
        return {
          success: false,
          message: "Only staff can record cash payments",
        };
      }
    }

    // 3. Feature Enablement Check
    if (purpose === "SOCIETY_DUES") {
      if (!societyId) {
        return {
          success: false,
          message: "Society is required for society dues",
        };
      }

      const parishionerId =
        paymentData.parishionerId || session?.user?.parishionerId;
      if (!parishionerId) {
        return {
          success: false,
          message: "Parishioner must be specified for society dues",
        };
      }

      if (
        session?.user?.role === "PARISHIONER" &&
        paymentMethod !== "BANK_TRANSFER"
      ) {
        return {
          success: false,
          message: "Society dues payments must be made by bank transfer",
        };
      }

      const membership = await db.societyMembership.findFirst({
        where: {
          parishionerId,
          societyId,
        },
      });

      if (!membership) {
        return {
          success: false,
          message: "You must be a member of this society to pay dues",
        };
      }
    }

    const featureCheck = await checkFeatureEnabled(
      targetOrgId,
      purpose,
      session?.user?.role,
    );
    if (!featureCheck.enabled) {
      return {
        success: false,
        message: featureCheck.message || "This payment feature is not enabled",
      };
    }

    // 4. Resolve recordedById (required): use session user or first org admin for guest checkout
    let recordedById: string;
    if (session?.user?.id) {
      recordedById = session.user.id;
    } else {
      const orgUser = await db.user.findFirst({
        where: { organizationId: targetOrgId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (!orgUser) {
        return {
          success: false,
          message: "No organization user found to record payment",
        };
      }
      recordedById = orgUser.id;
    }

    // 5. Generate receipt number
    const receiptNumber = await generateReceiptNumber(targetOrgId);

    // 6. Create payment (map EVENT_PAYMENT to OTHER; Prisma enum has no EVENT_PAYMENT)
    const dbPurpose = purpose === "EVENT_PAYMENT" ? "OTHER" : purpose;
    const {
      eventId: _eventId,
      paymentGateway: _paymentGateway,
      description: _description,
      paymentDate: formPaymentDate,
      ...restPaymentData
    } = paymentData;

    // Derive month from paymentDate if provided, otherwise use form month
    const derivedMonth = formPaymentDate
      ? new Date(formPaymentDate).getMonth() + 1
      : restPaymentData.month;

    const finalParishionerId =
      purpose === "SOCIETY_DUES"
        ? paymentData.parishionerId || session?.user?.parishionerId
        : paymentData.parishionerId;

    let payerName = paymentData.payerName;
    if (!payerName && purpose === "SOCIETY_DUES" && finalParishionerId) {
      const parishioner = await db.parishioner.findUnique({
        where: { id: finalParishionerId },
        select: { firstName: true, lastName: true },
      });
      if (parishioner) {
        payerName = `${parishioner.firstName ?? ""} ${parishioner.lastName ?? ""}`.trim();
      }
    }
    if (!payerName) {
      payerName = "Guest";
    }

    const finalPaymentData = {
      ...restPaymentData,
      parishionerId: finalParishionerId,
      societyId,
    };

    // Combine description into notes if provided
    const combinedNotes = [_description, finalPaymentData.notes]
      .filter(Boolean)
      .join(" — ");

    const payment = await db.payment.create({
      data: {
        ...finalPaymentData,
        month: derivedMonth,
        notes: combinedNotes || finalPaymentData.notes || undefined,
        payerName,
        purpose: dbPurpose,
        paymentMethod,
        currency: "NGN",
        paymentStatus: paymentMethod === "CASH" ? "COMPLETED" : "PENDING",
        paymentDate: formPaymentDate ? new Date(formPaymentDate) : undefined,
        receiptNumber,
        organizationId: targetOrgId,
        recordedById,
      },
      include: {
        parishioner: true,
        organization: true,
        recordedBy: true,
        massIntention: {
          include: {
            mass: true,
          },
        },
        donationCampaign: true,
      },
    });

    // 7. Audit Log (only if recorded by logged-in user)
    if (session) {
      await db.auditLog.create({
        data: {
          action: "PAYMENT_RECORDED",
          entityType: "Payment",
          entityId: payment.id,
          performedBy: session.user.id,
          details: {
            amount: payment.amount,
            purpose: payment.purpose,
            receiptNumber,
          },
        },
      });
    }

    revalidatePath("/dashboard/payments");
    return {
      success: true,
      message:
        paymentMethod === "CASH"
          ? "Payment recorded successfully"
          : "Payment initiated",
      data: payment,
    };
  } catch (error) {
    console.error("Failed to create payment:", error);
    return { success: false, message: "Failed to process payment" };
  }
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update a payment (only pending payments can be edited)
 */
export async function updatePayment(
  id: string,
  formData: unknown,
): Promise<ActionResponse<PaymentWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Authorization
    const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, message: "Permission denied" };
    }

    // Validation
    const parsed = updatePaymentSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Check if payment exists and belongs to organization
    const existing = await db.payment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return { success: false, message: "Payment not found" };
    }

    // Only pending payments can be edited
    if (existing.paymentStatus !== "PENDING") {
      return {
        success: false,
        message: "Only pending payments can be edited",
      };
    }

    // Update payment
    const payment = await db.payment.update({
      where: { id },
      data: parsed.data,
      include: {
        parishioner: true,
        organization: true,
        recordedBy: true,
        massIntention: {
          include: {
            mass: true,
          },
        },
        donationCampaign: true,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "Payment",
        entityId: id,
        performedBy: session.user.id,
        details: {
          updatedFields: Object.keys(parsed.data),
        },
      },
    });

    revalidatePath("/dashboard/payments");
    revalidatePath(`/dashboard/payments/${id}`);

    return {
      success: true,
      message: "Payment updated successfully",
      data: payment,
    };
  } catch (error) {
    console.error("Failed to update payment:", error);
    return { success: false, message: "Failed to update payment" };
  }
}

/**
 * Mark a payment as completed
 */
export async function completePayment(
  id: string,
): Promise<ActionResponse<PaymentWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, message: "Permission denied" };
    }

    const existing = await db.payment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return { success: false, message: "Payment not found" };
    }

    if (existing.paymentStatus === "COMPLETED") {
      return { success: false, message: "Payment already completed" };
    }

    const payment = await db.payment.update({
      where: { id },
      data: { paymentStatus: "COMPLETED" },
      include: {
        parishioner: true,
        organization: true,
        recordedBy: true,
        massIntention: {
          include: {
            mass: true,
          },
        },
        donationCampaign: true,
      },
    });

    revalidatePath("/dashboard/payments");

    return {
      success: true,
      message: "Payment marked as completed",
      data: payment,
    };
  } catch (error) {
    console.error("Failed to complete payment:", error);
    return { success: false, message: "Failed to complete payment" };
  }
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a payment (only admins, only pending payments)
 */
export async function deletePayment(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only admins can delete
    if (!["SUPER_ADMIN", "PARISH_ADMIN"].includes(session.user.role)) {
      return { success: false, message: "Permission denied" };
    }

    // Verify ownership
    const existing = await db.payment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return { success: false, message: "Payment not found" };
    }

    // Only pending or failed payments can be deleted
    if (!["PENDING", "FAILED"].includes(existing.paymentStatus)) {
      return {
        success: false,
        message: "Only pending or failed payments can be deleted",
      };
    }

    await db.payment.delete({ where: { id } });

    // Audit Log
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "Payment",
        entityId: id,
        performedBy: session.user.id,
        details: {
          receiptNumber: existing.receiptNumber,
          amount: existing.amount,
        },
      },
    });

    revalidatePath("/dashboard/payments");

    return { success: true, message: "Payment deleted successfully" };
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return { success: false, message: "Failed to delete payment" };
  }
}
