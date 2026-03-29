"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import {
  generatePaystackReference,
  getDefaultDvaProvider,
  nairaToKobo,
  paystackRequest,
  PaystackCustomerData,
  PaystackDedicatedAccountData,
  PaystackError,
  PaystackInitializeTransactionData,
  PaystackResolvedBankAccount,
  PaystackSubaccountData,
  PaystackTransferData,
  PaystackTransferRecipientData,
  PaystackVerifyTransactionData,
} from "@/lib/paystack";
import {
  organizationPaystackProfileSchema,
  withdrawalRequestSchema,
} from "@/lib/validators/paystack.schema";
import { paystackInitializeSchema } from "@/lib/validators/payment.schema";
import type { ActionResponse } from "@/types";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const PAYMENT_ADMIN_ROLES = ["SUPER_ADMIN", "PARISH_ADMIN"];
const PAYMENT_VIEW_ROLES = ["SUPER_ADMIN", "PARISH_ADMIN", "PARISH_SECRETARY"];
const PLATFORM_FLAT_FEE_NAIRA = Number(
  process.env.PAYSTACK_PLATFORM_FLAT_FEE_NAIRA || "20",
);

type AppSession = {
  user: {
    id: string;
    role: string;
    organizationId: string;
  };
};

type ResolvedOrganizationContext =
  | {
      session: AppSession;
      organizationId: string;
    }
  | { error: ActionResponse };

function hasRole(role: string | undefined | null, allowedRoles: string[]) {
  return !!role && allowedRoles.includes(role);
}

function getFallbackPaystackEmail(organizationId: string) {
  return `paystack-${organizationId}@ecclesia.local`;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function resolveAccessibleOrganizationId(
  targetOrganizationId?: string,
): Promise<ResolvedOrganizationContext> {
  const session = (await auth()) as AppSession | null;
  if (!session?.user?.organizationId) {
    return { error: { success: false, message: "Unauthorized" } };
  }

  const organizationId =
    session.user.role === "SUPER_ADMIN" && targetOrganizationId
      ? targetOrganizationId
      : session.user.organizationId;

  return { session, organizationId };
}

async function ensureOnlinePaymentsEnabled(organizationId: string) {
  const settings = await db.organizationFeatureSettings.findUnique({
    where: { organizationId },
    select: { enableOnlinePayments: true },
  });

  return settings?.enableOnlinePayments ?? false;
}

async function resolveRecordedById(organizationId: string, userId?: string) {
  if (userId) return userId;

  const orgUser = await db.user.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!orgUser) {
    throw new Error("No organization user found to record payment");
  }

  return orgUser.id;
}

async function generateReceiptNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const prefix = `RCP-${year}`;
  const lastPayment = await db.payment.findFirst({
    where: {
      organizationId,
      receiptNumber: { startsWith: prefix },
    },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });

  const lastNumber = lastPayment?.receiptNumber
    ? Number(lastPayment.receiptNumber.split("-").pop() || "0")
    : 0;

  return `${prefix}-${String(lastNumber + 1).padStart(6, "0")}`;
}

async function computeWalletFigures(organizationId: string) {
  const [completedPayments, reservedWithdrawals] = await Promise.all([
    db.payment.aggregate({
      where: {
        organizationId,
        paymentStatus: "COMPLETED",
      },
      _sum: { amount: true },
    }),
    db.withdrawalRequest.aggregate({
      where: {
        organizationId,
        status: {
          in: ["REQUESTED", "PROCESSING", "OTP_REQUIRED", "COMPLETED"],
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalReceived = completedPayments._sum.amount || 0;
  const totalReserved = reservedWithdrawals._sum.amount || 0;

  return {
    totalReceived,
    totalReserved,
    availableBalance: Math.max(0, totalReceived - totalReserved),
  };
}

export async function getOrganizationPaymentProfile(
  targetOrganizationId?: string,
): Promise<ActionResponse> {
  const resolved = await resolveAccessibleOrganizationId(targetOrganizationId);
  if ("error" in resolved) return resolved.error;

  const { session, organizationId } = resolved;
  if (!hasRole(session.user.role, PAYMENT_VIEW_ROLES)) {
    return { success: false, message: "Permission denied" };
  }

  const [organization, wallet] = await Promise.all([
    db.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        level: true,
        payoutBankCode: true,
        payoutBankName: true,
        payoutAccountNumber: true,
        payoutAccountName: true,
        paystackCustomerCode: true,
        paystackSubaccountCode: true,
        paystackSubaccountStatus: true,
        paystackSubaccountName: true,
        paystackTransferRecipientCode: true,
        paystackDedicatedAccountId: true,
        paystackDedicatedAccountNumber: true,
        paystackDedicatedBankName: true,
        paystackDedicatedProviderSlug: true,
      },
    }),
    computeWalletFigures(organizationId),
  ]);

  if (!organization) {
    return { success: false, message: "Organization not found" };
  }

  return {
    success: true,
    message: "Payment profile retrieved successfully",
    data: {
      ...organization,
      wallet,
    },
  };
}

export async function configureOrganizationPaystackProfile(
  formData: unknown,
  targetOrganizationId?: string,
): Promise<ActionResponse> {
  const resolved = await resolveAccessibleOrganizationId(targetOrganizationId);
  if ("error" in resolved) return resolved.error;

  const { session, organizationId } = resolved;
  if (!hasRole(session.user.role, PAYMENT_ADMIN_ROLES)) {
    return { success: false, message: "Permission denied" };
  }

  const parsed = organizationPaystackProfileSchema.safeParse(formData);
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
      name: true,
      level: true,
      contactEmail: true,
      contactPhone: true,
      paystackCustomerCode: true,
      paystackSubaccountCode: true,
      paystackDedicatedAccountId: true,
    },
  });

  if (!organization) {
    return { success: false, message: "Organization not found" };
  }

  try {
    const profile = parsed.data;
    const businessName = profile.businessName || organization.name;
    const contactEmail =
      profile.contactEmail || organization.contactEmail || getFallbackPaystackEmail(organization.id);
    const contactPhone = profile.contactPhone || organization.contactPhone || undefined;

    const resolvedAccount = await paystackRequest<PaystackResolvedBankAccount>(
      `/bank/resolve?account_number=${encodeURIComponent(
        profile.accountNumber,
      )}&bank_code=${encodeURIComponent(profile.bankCode)}`,
    );

    let customerCode = organization.paystackCustomerCode;
    if (customerCode) {
      await paystackRequest(`/customer/${encodeURIComponent(customerCode)}`, {
        method: "PUT",
        body: JSON.stringify({
          first_name: businessName,
          last_name: organization.level,
          phone: contactPhone,
        }),
      });
    } else {
      const customer = await paystackRequest<PaystackCustomerData>("/customer", {
        method: "POST",
        body: JSON.stringify({
          email: contactEmail,
          first_name: businessName,
          last_name: organization.level,
          phone: contactPhone,
          metadata: {
            organizationId: organization.id,
            organizationName: organization.name,
          },
        }),
      });
      customerCode = customer.data.customer_code;
    }

    let subaccountCode = organization.paystackSubaccountCode;
    if (subaccountCode) {
      await paystackRequest(`/subaccount/${encodeURIComponent(subaccountCode)}`, {
        method: "PUT",
        body: JSON.stringify({
          business_name: businessName,
          description: `${organization.level} wallet on Ecclesia`,
          bank_code: profile.bankCode,
          account_number: profile.accountNumber,
          percentage_charge: 0,
          settlement_schedule: profile.settlementSchedule,
          primary_contact_email: contactEmail,
          primary_contact_name: businessName,
          primary_contact_phone: contactPhone,
          active: true,
          metadata: JSON.stringify({ organizationId: organization.id }),
        }),
      });
    } else {
      const subaccount = await paystackRequest<PaystackSubaccountData>("/subaccount", {
        method: "POST",
        body: JSON.stringify({
          business_name: businessName,
          settlement_bank: profile.bankCode,
          account_number: profile.accountNumber,
          percentage_charge: 0,
          description: `${organization.level} wallet on Ecclesia`,
          primary_contact_email: contactEmail,
          primary_contact_name: businessName,
          primary_contact_phone: contactPhone,
          metadata: JSON.stringify({ organizationId: organization.id }),
        }),
      });
      subaccountCode = subaccount.data.subaccount_code;
    }

    const recipient = await paystackRequest<PaystackTransferRecipientData>(
      "/transferrecipient",
      {
        method: "POST",
        body: JSON.stringify({
          type: "nuban",
          name: resolvedAccount.data.account_name,
          account_number: profile.accountNumber,
          bank_code: profile.bankCode,
          currency: "NGN",
          description: `${organization.name} withdrawal recipient`,
          metadata: {
            organizationId: organization.id,
          },
        }),
      },
    );

    let dedicatedAccount:
      | PaystackDedicatedAccountData
      | undefined;
    let dvaWarning: string | undefined;
    if (profile.createDedicatedAccount && customerCode && !organization.paystackDedicatedAccountId) {
      try {
        const dva = await paystackRequest<PaystackDedicatedAccountData>(
          "/dedicated_account",
          {
            method: "POST",
            body: JSON.stringify({
              customer: customerCode,
              preferred_bank:
                profile.dedicatedProviderSlug || getDefaultDvaProvider(),
              subaccount: subaccountCode,
              phone: contactPhone,
            }),
          },
        );
        dedicatedAccount = dva.data;
      } catch (dvaError: any) {
        console.warn("DVA creation skipped:", dvaError?.message || dvaError);
        dvaWarning = dvaError?.message || "Dedicated account not available for your business";
      }
    }

    const updatedOrganization = await db.organization.update({
      where: { id: organization.id },
      data: {
        payoutBankCode: profile.bankCode,
        payoutBankName: profile.bankName,
        payoutAccountNumber: profile.accountNumber,
        payoutAccountName: resolvedAccount.data.account_name,
        paystackCustomerCode: customerCode,
        paystackSubaccountCode: subaccountCode,
        paystackSubaccountStatus: "ACTIVE",
        paystackSubaccountName: businessName,
        paystackTransferRecipientCode: recipient.data.recipient_code,
        paystackDedicatedAccountId:
          dedicatedAccount ? String(dedicatedAccount.id) : undefined,
        paystackDedicatedAccountNumber:
          dedicatedAccount?.account_number,
        paystackDedicatedBankName: dedicatedAccount?.bank.name,
        paystackDedicatedProviderSlug:
          dedicatedAccount?.bank.slug ||
          profile.dedicatedProviderSlug ||
          getDefaultDvaProvider(),
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "OrganizationPaymentProfile",
        entityId: organization.id,
        performedBy: session.user.id,
        details: {
          paystackSubaccountCode: updatedOrganization.paystackSubaccountCode,
          paystackTransferRecipientCode:
            updatedOrganization.paystackTransferRecipientCode,
          paystackDedicatedAccountNumber:
            updatedOrganization.paystackDedicatedAccountNumber,
        },
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/payments");
    revalidatePath("/payments");

    const successMsg = dvaWarning
      ? `Profile configured successfully. Note: Dedicated account was skipped — ${dvaWarning}`
      : "Paystack payment profile configured successfully";

    return {
      success: true,
      message: successMsg,
      data: {
        paystackSubaccountCode: updatedOrganization.paystackSubaccountCode,
        paystackTransferRecipientCode:
          updatedOrganization.paystackTransferRecipientCode,
        paystackDedicatedAccountNumber:
          updatedOrganization.paystackDedicatedAccountNumber,
        payoutAccountName: updatedOrganization.payoutAccountName,
      },
    };
  } catch (error) {
    console.error("Failed to configure Paystack profile:", error);

    const message =
      error instanceof PaystackError
        ? error.message
        : "Failed to configure Paystack profile";

    await db.organization.update({
      where: { id: organization.id },
      data: { paystackSubaccountStatus: "ERROR" },
    });

    return {
      success: false,
      message,
    };
  }
}

export async function initializePaystackPayment(
  formData: unknown,
  organizationId?: string,
): Promise<ActionResponse<{
  paymentId: string;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
  intendedAmount: number;
  grossAmount: number;
  platformFee: number;
  processorFee: number;
}>> {
  const session = await auth();
  const parsed = paystackInitializeSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const targetOrganizationId = organizationId || session?.user?.organizationId;
  if (!targetOrganizationId) {
    return { success: false, message: "Organization context required" };
  }

  const onlinePaymentsEnabled = await ensureOnlinePaymentsEnabled(targetOrganizationId);
  if (!onlinePaymentsEnabled) {
    return { success: false, message: "Online payments are not enabled" };
  }

  const organization = await db.organization.findUnique({
    where: { id: targetOrganizationId },
    select: {
      id: true,
      name: true,
      paystackSubaccountCode: true,
      paystackSubaccountStatus: true,
    },
  });

  if (!organization) {
    return { success: false, message: "Organization not found" };
  }

  if (!organization.paystackSubaccountCode || organization.paystackSubaccountStatus !== "ACTIVE") {
    return {
      success: false,
      message: "Organization Paystack profile is not configured",
    };
  }

  if (
    parsed.data.purpose === "MASS_INTENTION" &&
    parsed.data.amount < 500
  ) {
    return {
      success: false,
      message: "Mass intention payment must be at least ₦500",
      errors: { amount: ["Mass intention payment must be at least ₦500"] },
    };
  }

  const platformFee = PLATFORM_FLAT_FEE_NAIRA;
  const processorFee = 0;
  const grossAmount = Number(
    (parsed.data.amount + platformFee + processorFee).toFixed(2),
  );
  const gatewayReference = generatePaystackReference("pay");

  try {
    const recordedById = await resolveRecordedById(
      targetOrganizationId,
      session?.user?.id,
    );
    const receiptNumber = await generateReceiptNumber(targetOrganizationId);
    const dbPurpose =
      parsed.data.purpose === "EVENT_PAYMENT" ? "OTHER" : parsed.data.purpose;

    const payment = await db.payment.create({
      data: {
        amount: parsed.data.amount,
        intendedAmount: parsed.data.amount,
        grossAmount,
        platformFee,
        processorFee,
        currency: "NGN",
        purpose: dbPurpose,
        paymentMethod: "CARD",
        paymentStatus: "PENDING",
        transactionRef: gatewayReference,
        gateway: "PAYSTACK",
        gatewayReference,
        gatewayStatus: "initialized",
        parishionerId: parsed.data.parishionerId,
        payerName: parsed.data.payerName,
        payerEmail: parsed.data.email,
        massIntentionId: parsed.data.massIntentionId,
        donationCampaignId: parsed.data.donationCampaignId,
        month: parsed.data.month,
        recordedById,
        receiptNumber,
        organizationId: targetOrganizationId,
      },
    });

    const callbackBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const paystack = await paystackRequest<PaystackInitializeTransactionData>(
      "/transaction/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          email: parsed.data.email,
          amount: String(nairaToKobo(grossAmount)),
          reference: gatewayReference,
          callback_url: `${callbackBaseUrl}/payments/callback`,
          currency: "NGN",
          subaccount: organization.paystackSubaccountCode,
          transaction_charge: nairaToKobo(platformFee + processorFee),
          bearer: "account",
          metadata: {
            paymentId: payment.id,
            organizationId: targetOrganizationId,
            intendedAmount: parsed.data.amount,
            grossAmount,
            platformFee,
            processorFee,
            purpose: parsed.data.purpose,
            massIntentionId: parsed.data.massIntentionId,
            donationCampaignId: parsed.data.donationCampaignId,
          },
        }),
      },
    );

    await db.payment.update({
      where: { id: payment.id },
      data: {
        gatewayMeta: toPrismaJson(paystack.data),
      },
    });

    return {
      success: true,
      message: "Payment initialized successfully",
      data: {
        paymentId: payment.id,
        reference: gatewayReference,
        authorizationUrl: paystack.data.authorization_url,
        accessCode: paystack.data.access_code,
        intendedAmount: parsed.data.amount,
        grossAmount,
        platformFee,
        processorFee,
      },
    };
  } catch (error) {
    console.error("Failed to initialize Paystack payment:", error);
    return {
      success: false,
      message:
        error instanceof PaystackError
          ? error.message
          : "Failed to initialize payment",
    };
  }
}

export async function verifyPaystackPayment(
  reference: string,
): Promise<ActionResponse> {
  try {
    const payment = await db.payment.findFirst({
      where: {
        OR: [{ gatewayReference: reference }, { transactionRef: reference }],
      },
    });

    if (!payment) {
      return { success: false, message: "Payment not found" };
    }

    if (payment.paymentStatus === "COMPLETED") {
      return { success: true, message: "Payment already verified", data: payment };
    }

    const verification = await paystackRequest<PaystackVerifyTransactionData>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );

    const expectedGrossAmount = payment.grossAmount ?? payment.amount;
    const amountMatches = verification.data.amount === nairaToKobo(expectedGrossAmount);

    if (
      verification.data.status === "success" &&
      verification.data.currency === payment.currency &&
      amountMatches
    ) {
      const updated = await db.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: "COMPLETED",
          gatewayStatus: verification.data.status,
          gatewayMeta: toPrismaJson(verification.data),
          paymentDate: verification.data.paid_at
            ? new Date(verification.data.paid_at)
            : undefined,
        },
      });

      return {
        success: true,
        message: "Payment verified successfully",
        data: updated,
      };
    }

    const failed = await db.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: "FAILED",
        gatewayStatus: verification.data.status,
        gatewayMeta: toPrismaJson(verification.data),
      },
    });

    return {
      success: false,
      message: amountMatches
        ? `Payment verification failed with status ${verification.data.status}`
        : "Payment amount mismatch during verification",
      data: failed,
    };
  } catch (error) {
    console.error("Failed to verify Paystack payment:", error);
    return {
      success: false,
      message:
        error instanceof PaystackError
          ? error.message
          : "Failed to verify payment",
    };
  }
}

export async function getOrganizationWalletSummary(
  targetOrganizationId?: string,
): Promise<ActionResponse> {
  const resolved = await resolveAccessibleOrganizationId(targetOrganizationId);
  if ("error" in resolved) return resolved.error;

  const { session, organizationId } = resolved;
  if (!hasRole(session.user.role, PAYMENT_VIEW_ROLES)) {
    return { success: false, message: "Permission denied" };
  }

  const [wallet, recentWithdrawals] = await Promise.all([
    computeWalletFigures(organizationId),
    db.withdrawalRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    success: true,
    message: "Wallet summary retrieved successfully",
    data: {
      ...wallet,
      recentWithdrawals,
    },
  };
}

export async function requestOrganizationWithdrawal(
  formData: unknown,
  targetOrganizationId?: string,
): Promise<ActionResponse> {
  const resolved = await resolveAccessibleOrganizationId(targetOrganizationId);
  if ("error" in resolved) return resolved.error;

  const { session, organizationId } = resolved;
  if (!hasRole(session.user.role, PAYMENT_ADMIN_ROLES)) {
    return { success: false, message: "Permission denied" };
  }

  const parsed = withdrawalRequestSchema.safeParse(formData);
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
      name: true,
      paystackTransferRecipientCode: true,
    },
  });

  if (!organization) {
    return { success: false, message: "Organization not found" };
  }

  if (!organization.paystackTransferRecipientCode) {
    return {
      success: false,
      message: "Organization withdrawal account is not configured",
    };
  }

  const wallet = await computeWalletFigures(organizationId);
  if (parsed.data.amount > wallet.availableBalance) {
    return {
      success: false,
      message: "Insufficient available balance for withdrawal",
      errors: {
        amount: [
          `Available balance is ₦${wallet.availableBalance.toFixed(2)}`,
        ],
      },
    };
  }

  const transferReference = generatePaystackReference("wd");
  const withdrawal = await db.withdrawalRequest.create({
    data: {
      organizationId,
      requestedById: session.user.id,
      amount: parsed.data.amount,
      status: "REQUESTED",
      recipientCode: organization.paystackTransferRecipientCode,
      transferReference,
      notes: parsed.data.notes,
    },
  });

  try {
    const transfer = await paystackRequest<PaystackTransferData>("/transfer", {
      method: "POST",
      body: JSON.stringify({
        source: "balance",
        amount: nairaToKobo(parsed.data.amount),
        recipient: organization.paystackTransferRecipientCode,
        reference: transferReference,
        reason: parsed.data.notes || `${organization.name} withdrawal`,
        currency: "NGN",
      }),
    });

    const nextStatus =
      transfer.data.status === "otp" ? "OTP_REQUIRED" : "PROCESSING";

    const updatedWithdrawal = await db.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: {
        status: nextStatus,
        transferCode: transfer.data.transfer_code,
        gatewayStatus: transfer.data.status,
        gatewayMeta: toPrismaJson(transfer.data),
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "WithdrawalRequest",
        entityId: updatedWithdrawal.id,
        performedBy: session.user.id,
        details: {
          amount: parsed.data.amount,
          transferReference,
          status: nextStatus,
        },
      },
    });

    return {
      success: true,
      message:
        nextStatus === "OTP_REQUIRED"
          ? "Withdrawal initiated, but Paystack OTP is required. Disable transfer OTP in Paystack for full automation."
          : "Withdrawal requested and sent to Paystack successfully",
      data: updatedWithdrawal,
    };
  } catch (error) {
    console.error("Failed to request withdrawal:", error);

    const failed = await db.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: {
        status: "FAILED",
        failureReason:
          error instanceof PaystackError
            ? error.message
            : "Failed to initiate withdrawal",
      },
    });

    return {
      success: false,
      message:
        error instanceof PaystackError
          ? error.message
          : "Failed to initiate withdrawal",
      data: failed,
    };
  }
}

// ============================================
// BANK LIST
// ============================================

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}

export async function getPaystackBankList(): Promise<ActionResponse> {
  try {
    const response = await paystackRequest<PaystackBank[]>(
      "/bank?country=nigeria&perPage=100",
    );

    const banks = response.data
      .filter((b) => b.active)
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((b, i, arr) => arr.findIndex((x) => x.code === b.code) === i);

    return {
      success: true,
      message: "Bank list retrieved",
      data: banks,
    };
  } catch (error) {
    console.error("Failed to fetch bank list:", error);
    return {
      success: false,
      message:
        error instanceof PaystackError
          ? error.message
          : "Failed to fetch bank list",
    };
  }
}