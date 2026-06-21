"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import type { ActionResponse } from "@/types";
import type { JoinRequestWithParishionerAndSociety } from "@/app/actions/society.actions";

export interface SystemMetrics {
  totalOrganizations: number;
  totalParishes: number;
  totalOutstations: number;
  totalUsers: number;
  activeUsers: number;
  totalParishioners: number;
  totalPayments: number;
  totalPaymentAmount: number;
  totalMassIntentions: number;
  totalAppointments: number;
  averageUsersPerOrg: number;
  paystackRevenue: number;
  offlineRevenue: number;
  manualDigitalRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  failedPaymentsCount: number;
  failedPaymentsAmount: number;
}

export interface OrganizationDashboardMetrics {
  totalParishioners: number;
  totalPayments: number;
  totalPaymentAmount: number;
  upcomingAppointments: number;
  totalMassIntentions: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
    details: { message: string };
  }>;
  paystackRevenue: number;
  offlineRevenue: number;
  manualDigitalRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  failedPaymentsCount: number;
  failedPaymentsAmount: number;
}

/**
 * Get system-wide metrics (SUPER_ADMIN only)
 */
export async function getSystemMetrics(): Promise<
  ActionResponse<SystemMetrics>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Only super admins can view system metrics
    if (session.user.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Only super admins can view system metrics",
      };
    }

    // Fetch all metrics in parallel
    const [
      totalUsers,
      activeUsers,
      totalParishes,
      totalOutstations,
      totalParishioners,
      totalPayments,
      totalMassIntentions,
      totalAppointments,
      paystackRevenueAgg,
      offlineRevenueAgg,
      manualDigitalRevenueAgg,
      pendingPaymentsCount,
      pendingPaymentsAgg,
      failedPaymentsCount,
      failedPaymentsAgg,
    ] = await Promise.all([
      // Users
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      // Organizations
      db.organization.count({ where: { level: "PARISH" } }),
      db.organization.count({ where: { level: "OUTSTATION" } }),
      // Parishioners
      db.parishioner.count(),
      // Completed Payments
      db.payment.count({ where: { paymentStatus: "COMPLETED" } }),
      // Mass Intentions
      db.massIntention.count(),
      // Appointments
      db.appointment.count(),
      // Paystack Completed
      db.payment.aggregate({
        where: { paymentStatus: "COMPLETED", gateway: "PAYSTACK" },
        _sum: { amount: true },
      }),
      // Cash/Check Completed (Offline)
      db.payment.aggregate({
        where: { paymentStatus: "COMPLETED", gateway: null, paymentMethod: { in: ["CASH", "CHECK"] } },
        _sum: { amount: true },
      }),
      // Card/Transfer Manual Completed (No Gateway)
      db.payment.aggregate({
        where: { paymentStatus: "COMPLETED", gateway: null, paymentMethod: { in: ["CARD", "BANK_TRANSFER", "MOBILE_MONEY"] } },
        _sum: { amount: true },
      }),
      // Pending Count
      db.payment.count({ where: { paymentStatus: "PENDING" } }),
      // Pending Amount
      db.payment.aggregate({
        where: { paymentStatus: "PENDING" },
        _sum: { amount: true },
      }),
      // Failed Count
      db.payment.count({ where: { paymentStatus: "FAILED" } }),
      // Failed Amount
      db.payment.aggregate({
        where: { paymentStatus: "FAILED" },
        _sum: { amount: true },
      }),
    ]);

    const paystackRevenue = paystackRevenueAgg._sum.amount ?? 0;
    const offlineRevenue = offlineRevenueAgg._sum.amount ?? 0;
    const manualDigitalRevenue = manualDigitalRevenueAgg._sum.amount ?? 0;
    const totalPaymentAmount = paystackRevenue + offlineRevenue + manualDigitalRevenue;
    const pendingPaymentsAmount = pendingPaymentsAgg._sum.amount ?? 0;
    const failedPaymentsAmount = failedPaymentsAgg._sum.amount ?? 0;

    const totalOrganizations = totalParishes + totalOutstations;
    const averageUsersPerOrg =
      totalOrganizations > 0 ? Math.round(totalUsers / totalOrganizations) : 0;

    const metrics: SystemMetrics = {
      totalOrganizations,
      totalParishes,
      totalOutstations,
      totalUsers,
      activeUsers,
      totalParishioners,
      totalPayments,
      totalPaymentAmount,
      totalMassIntentions,
      totalAppointments,
      averageUsersPerOrg,
      paystackRevenue,
      offlineRevenue,
      manualDigitalRevenue,
      pendingPaymentsCount,
      pendingPaymentsAmount,
      failedPaymentsCount,
      failedPaymentsAmount,
    };

    return {
      success: true,
      message: "System metrics retrieved",
      data: metrics,
    };
  } catch (error) {
    console.error("Failed to get system metrics:", error);
    return { success: false, message: "Failed to retrieve system metrics" };
  }
}

/**
 * Get organization dashboard metrics (staff/admin roles)
 */
export async function getOrganizationDashboardMetrics(): Promise<
  ActionResponse<OrganizationDashboardMetrics>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const organizationId = session.user.organizationId;
    const now = new Date();

    const [
      totalParishioners,
      totalPayments,
      paystackRevenueAgg,
      offlineRevenueAgg,
      manualDigitalRevenueAgg,
      pendingPaymentsCount,
      pendingPaymentsAgg,
      failedPaymentsCount,
      failedPaymentsAgg,
      upcomingAppointments,
      totalMassIntentions,
      recentPayments,
      recentParishioners,
      recentMassIntentions,
      recentAppointments,
      recentFinancialEntries,
    ] = await Promise.all([
      db.parishioner.count({
        where: { organizationId, isActive: true },
      }),
      db.payment.count({
        where: { organizationId, paymentStatus: "COMPLETED" },
      }),
      db.payment.aggregate({
        where: { organizationId, paymentStatus: "COMPLETED", gateway: "PAYSTACK" },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { organizationId, paymentStatus: "COMPLETED", gateway: null, paymentMethod: { in: ["CASH", "CHECK"] } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { organizationId, paymentStatus: "COMPLETED", gateway: null, paymentMethod: { in: ["CARD", "BANK_TRANSFER", "MOBILE_MONEY"] } },
        _sum: { amount: true },
      }),
      db.payment.count({
        where: { organizationId, paymentStatus: "PENDING" },
      }),
      db.payment.aggregate({
        where: { organizationId, paymentStatus: "PENDING" },
        _sum: { amount: true },
      }),
      db.payment.count({
        where: { organizationId, paymentStatus: "FAILED" },
      }),
      db.payment.aggregate({
        where: { organizationId, paymentStatus: "FAILED" },
        _sum: { amount: true },
      }),
      db.appointment.count({
        where: {
          organizationId,
          startTime: { gte: now },
          status: { not: "CANCELLED" },
        },
      }),
      db.massIntention.count({
        where: { organizationId },
      }),
      db.payment.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, amount: true, createdAt: true },
      }),
      db.parishioner.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
      db.massIntention.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, requestedBy: true, createdAt: true },
      }),
      db.appointment.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      }),
      db.parishFinancialEntry.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          amount: true,
          entryType: true,
          createdAt: true,
          recordedBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const paystackRevenue = paystackRevenueAgg._sum.amount ?? 0;
    const offlineRevenue = offlineRevenueAgg._sum.amount ?? 0;
    const manualDigitalRevenue = manualDigitalRevenueAgg._sum.amount ?? 0;
    const totalPaymentAmount = paystackRevenue + offlineRevenue + manualDigitalRevenue;
    const pendingPaymentsAmount = pendingPaymentsAgg._sum.amount ?? 0;
    const failedPaymentsAmount = failedPaymentsAgg._sum.amount ?? 0;

    const recentActivity = [
      ...recentPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        action: "CREATED",
        entityType: "Payment",
        createdAt: payment.createdAt,
        details: {
          message: `Payment recorded (₦${payment.amount.toLocaleString("en-NG")})`,
        },
      })),
      ...recentParishioners.map((parishioner) => ({
        id: `parishioner-${parishioner.id}`,
        action: "CREATED",
        entityType: "Parishioner",
        createdAt: parishioner.createdAt,
        details: {
          message: `New parishioner added: ${parishioner.firstName} ${parishioner.lastName}`,
        },
      })),
      ...recentMassIntentions.map((intention) => ({
        id: `mass-intention-${intention.id}`,
        action: "CREATED",
        entityType: "MassIntention",
        createdAt: intention.createdAt,
        details: {
          message: `Mass intention booked by ${intention.requestedBy}`,
        },
      })),
      ...recentAppointments.map((appointment) => ({
        id: `appointment-${appointment.id}`,
        action: "CREATED",
        entityType: "Appointment",
        createdAt: appointment.createdAt,
        details: {
          message: `Appointment created: ${appointment.title}`,
        },
      })),
      ...recentFinancialEntries.map((entry) => ({
        id: `financial-${entry.id}`,
        action: "CREATED",
        entityType: "ParishFinancialEntry",
        createdAt: entry.createdAt,
        details: {
          message: `${entry.title} recorded (₦${entry.amount.toLocaleString("en-NG")}) by ${entry.recordedBy.firstName} ${entry.recordedBy.lastName}`,
        },
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      success: true,
      message: "Organization dashboard metrics retrieved",
      data: {
        totalParishioners,
        totalPayments,
        totalPaymentAmount,
        upcomingAppointments,
        totalMassIntentions,
        recentActivity,
        paystackRevenue,
        offlineRevenue,
        manualDigitalRevenue,
        pendingPaymentsCount,
        pendingPaymentsAmount,
        failedPaymentsCount,
        failedPaymentsAmount,
      },
    };
  } catch (error) {
    console.error("Failed to get organization dashboard metrics:", error);
    return {
      success: false,
      message: "Failed to retrieve organization dashboard metrics",
    };
  }
}

export interface ParishionerDashboardMetrics {
  contributionsThisMonth: number;
  societyCount: number;
  pendingIntentions: number;
  upcomingEvents: number;
  societies: Array<{ id: string; name: string }>;
  pendingJoinRequests: JoinRequestWithParishionerAndSociety[];
}

/**
 * Get dashboard metrics for the logged-in parishioner
 */
export async function getParishionerDashboardMetrics(): Promise<
  ActionResponse<ParishionerDashboardMetrics>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    let parishionerId = session.user.parishionerId;
    const organizationId = session.user.organizationId;

    // Fallback: look up by email if session doesn't have parishionerId
    if (!parishionerId && session.user.email) {
      const parishioner = await db.parishioner.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      parishionerId = parishioner?.id ?? null;
    }

    if (!parishionerId) {
      return {
        success: true,
        message: "No parishioner record linked",
        data: {
          contributionsThisMonth: 0,
          societyCount: 0,
          pendingIntentions: 0,
          upcomingEvents: 0,
          societies: [],
          pendingJoinRequests: [],
        },
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      paymentAgg,
      societyMemberships,
      pendingIntentions,
      upcomingEvents,
      pendingJoinRequests,
    ] = await Promise.all([
      db.payment.aggregate({
        where: {
          parishionerId,
          paymentStatus: "COMPLETED",
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      db.societyMembership.findMany({
        where: { parishionerId },
        include: { society: { select: { id: true, name: true } } },
      }),
      db.massIntention.count({
        where: { parishionerId, status: "PENDING" },
      }),
      db.event.count({
        where: {
          organizationId,
          startTime: { gte: now },
        },
      }),
      db.societyJoinRequest.findMany({
        where: {
          status: "PENDING",
          society: {
            OR: [
              { presidentId: parishionerId },
              { secretaryId: parishionerId },
            ],
          },
        },
        include: {
          parishioner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          society: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      success: true,
      message: "Parishioner dashboard metrics retrieved",
      data: {
        contributionsThisMonth: paymentAgg._sum.amount ?? 0,
        societyCount: societyMemberships.length,
        pendingIntentions,
        upcomingEvents,
        societies: societyMemberships.map((m) => ({
          id: m.society.id,
          name: m.society.name,
        })),
        pendingJoinRequests,
      },
    };
  } catch (error) {
    console.error("Failed to get parishioner dashboard metrics:", error);
    return {
      success: false,
      message: "Failed to retrieve parishioner dashboard metrics",
    };
  }
}
