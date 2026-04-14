import { getPayments, getPaymentStats } from "@/app/actions/payment.actions";
import {
  getOrganizationPaymentProfile,
  getOrganizationWalletSummary,
  getPaystackBankList,
  type PaystackBank,
} from "@/app/actions/paystack.actions";
import { auth } from "@/auth";
import { PaystackWalletPanel } from "@/components/features/payments/paystack-wallet-panel";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import PaymentsListClient from "./payments-list-client";
import { PaymentsTable } from "./payments-table";

export default async function PaymentsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const canViewPayments = [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
  ].includes(session.user.role);
  if (!canViewPayments) redirect("/dashboard");

  // Await searchParams in Next.js 16
  const searchParams = await searchParamsPromise;

  // Fetch payments and stats
  const [
    paymentsResult,
    statsResult,
    walletProfileResult,
    walletSummaryResult,
    bankListResult,
  ] = await Promise.all([
    getPayments({
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 20,
      search: searchParams.search,
      purpose: searchParams.purpose as any,
      status: searchParams.status as any,
      method: searchParams.method as any,
    }),
    getPaymentStats(),
    getOrganizationPaymentProfile(),
    getOrganizationWalletSummary(),
    getPaystackBankList(),
  ]);

  if (!paymentsResult.success || !statsResult.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-destructive">
            {paymentsResult.message || statsResult.message}
          </p>
        </div>
      </div>
    );
  }

  const { payments, total } = paymentsResult.data!;
  const stats = statsResult.data!;

  // Calculate today's revenue (from stats)
  const todayRevenue = payments
    .filter((p) => {
      const paymentDate = new Date(p.paymentDate);
      const today = new Date();
      return (
        p.paymentStatus === "COMPLETED" &&
        paymentDate.toDateString() === today.toDateString()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = payments.filter(
    (p) => p.paymentStatus === "PENDING",
  ).length;

  const canManageWallet = ["SUPER_ADMIN", "PARISH_ADMIN"].includes(
    session.user.role,
  );
  const canViewStats = ["SUPER_ADMIN", "PARISH_ADMIN"].includes(
    session.user.role,
  );
  const canManageTypes = [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
  ].includes(session.user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Track offerings, tithes, and donations.
          </p>
        </div>
        <div className="flex gap-2">
          {canManageTypes && (
            <Button variant="outline" asChild>
              <Link href="/payments/types">Payment Types</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href="/api/payments/export">
              <Download className="mr-2 h-4 w-4" /> Export
            </a>
          </Button>
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats — admin only */}
      {canViewStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Today's Revenue
            </p>
            <p className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
              }).format(todayRevenue)}
            </p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Year Total ({new Date().getFullYear()})
            </p>
            <p className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
              }).format(stats.totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalCount} payments
            </p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Pending Payments
            </p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
        </div>
      )}

      {canManageWallet && (
        <PaystackWalletPanel
          profile={
            walletProfileResult.success
              ? (walletProfileResult.data as any)
              : undefined
          }
          wallet={
            walletSummaryResult.success
              ? (walletSummaryResult.data as any)
              : undefined
          }
          canManage={canManageWallet}
          banks={
            bankListResult.success
              ? (bankListResult.data as PaystackBank[])
              : []
          }
        />
      )}

      {/* Filters */}
      <PaymentsListClient searchParams={searchParams} />

      {/* Table Section */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-6">
        <PaymentsTable payments={payments} />
      </div>
    </div>
  );
}
