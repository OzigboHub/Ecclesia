import {
  getParishFinancialEntries,
  getParishFinancialStats,
} from "@/app/actions/parish-financial.actions";
import { auth } from "@/auth";
import { canManageFinancials } from "@/lib/permissions";
import { ENTRY_TYPE_LABELS } from "@/lib/validators/parish-financial.schema";
import { isAdminRole } from "@/lib/permissions";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ParishFinancesClient } from "./parish-finances-client";

export default async function ParishFinancesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!canManageFinancials(session.user.role)) {
    redirect("/dashboard");
  }

  const searchParams = await searchParamsPromise;

  const [entriesResult, statsResult] = await Promise.all([
    getParishFinancialEntries({
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 20,
      search: searchParams.search,
      entryType: searchParams.entryType as any,
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
    }),
    getParishFinancialStats(),
  ]);

  if (!entriesResult.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Parish Finances</h1>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-destructive">{entriesResult.message}</p>
        </div>
      </div>
    );
  }

  const { entries, total } = entriesResult.data!;
  const stats = statsResult.success ? statsResult.data! : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground">
            Parish Finances
          </h1>
          <p className="text-muted-foreground mt-1">
            Record and manage parish collections and financial entries.
          </p>
        </div>
        <Button asChild>
          <Link href="/parish-finances/new">
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Total Records
            </p>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalEntries}
            </p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Total Amount
            </p>
            <p className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
              }).format(stats.totalAmount)}
            </p>
          </div>
          {stats.byType.map((item) => (
            <div
              key={item.entryType}
              className="bg-background border border-border rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {ENTRY_TYPE_LABELS[
                  item.entryType as keyof typeof ENTRY_TYPE_LABELS
                ] || item.entryType}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                }).format(item.total)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.count} entries
              </p>
            </div>
          ))}
        </div>
      )}

      <ParishFinancesClient
        initialEntries={entries}
        total={total}
        canDelete={isAdminRole(session.user.role)}
      />
    </div>
  );
}
