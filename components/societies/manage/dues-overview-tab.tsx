"use client";

import {
  recordSocietyDue,
  updateSocietyDueAmount,
  type MemberDuesStatus,
} from "@/app/actions/society.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Circle, DollarSign, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface DuesOverviewTabProps {
  societyId: string;
  duesOverview: {
    members: MemberDuesStatus[];
    monthlyDueAmount: number | null;
    year: number;
  };
}

export function DuesOverviewTab({
  societyId,
  duesOverview,
}: DuesOverviewTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recordDialogOpen, setRecordDialogOpen] = React.useState(false);
  const [dueAmountDialogOpen, setDueAmountDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] =
    React.useState<MemberDuesStatus | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [dueAmount, setDueAmount] = React.useState(
    duesOverview.monthlyDueAmount?.toString() || "",
  );
  const [filter, setFilter] = React.useState<"all" | "owing" | "paid">("all");

  const currentMonth = new Date().getMonth() + 1;
  const monthsToShow = duesOverview.year === new Date().getFullYear()
    ? currentMonth
    : 12;

  const filteredMembers = duesOverview.members.filter((m) => {
    if (filter === "owing") return m.monthsOwing.length > 0;
    if (filter === "paid") return m.monthsOwing.length === 0;
    return true;
  });

  const handleCellClick = (member: MemberDuesStatus, month: number) => {
    if (member.monthsPaid.includes(month)) return; // Already paid
    setSelectedMember(member);
    setSelectedMonth(month);
    setPaymentAmount(duesOverview.monthlyDueAmount?.toString() || "");
    setRecordDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedMember || !selectedMonth || !paymentAmount) return;
    startTransition(async () => {
      const result = await recordSocietyDue(societyId, {
        parishionerId: selectedMember.parishionerId,
        amount: parseFloat(paymentAmount),
        month: selectedMonth,
        year: duesOverview.year,
        paymentMethod,
      });
      if (result.success) {
        toast.success(result.message);
        setRecordDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleUpdateDueAmount = () => {
    const amount = parseFloat(dueAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Invalid amount");
      return;
    }
    startTransition(async () => {
      const result = await updateSocietyDueAmount(societyId, amount);
      if (result.success) {
        toast.success(result.message);
        setDueAmountDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-4">
      {/* Header with filter and set dues */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Monthly Dues — {duesOverview.year}
          </h2>
          {duesOverview.monthlyDueAmount && (
            <p className="text-sm text-muted-foreground">
              Expected: {formatCurrency(duesOverview.monthlyDueAmount)} / month
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <SelectTrigger className="w-32.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="owing">Owing Only</SelectItem>
              <SelectItem value="paid">Paid Up</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDueAmountDialogOpen(true)}
          >
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Set Due
          </Button>
        </div>
      </div>

      {/* Dues Matrix Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-40">
                    Member
                  </TableHead>
                  {Array.from({ length: monthsToShow }, (_, i) => i + 1).map(
                    (month) => (
                      <TableHead
                        key={month}
                        className="text-center min-w-14"
                      >
                        {MONTH_NAMES[month - 1]}
                      </TableHead>
                    ),
                  )}
                  <TableHead className="text-right min-w-22.5">Paid</TableHead>
                  <TableHead className="text-right min-w-22.5">
                    Owing
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={monthsToShow + 3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No members to display.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.parishionerId}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        <div>
                          {member.firstName} {member.lastName}
                        </div>
                        {member.phone && (
                          <div className="text-xs text-muted-foreground">
                            {member.phone}
                          </div>
                        )}
                      </TableCell>
                      {Array.from(
                        { length: monthsToShow },
                        (_, i) => i + 1,
                      ).map((month) => {
                        const isPaid = member.monthsPaid.includes(month);
                        return (
                          <TableCell key={month} className="text-center p-1">
                            <button
                              type="button"
                              onClick={() =>
                                !isPaid && handleCellClick(member, month)
                              }
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                isPaid
                                  ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                                  : "text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                              }`}
                              title={
                                isPaid
                                  ? `${MONTH_NAMES[month - 1]} — Paid`
                                  : `Record payment for ${MONTH_NAMES[month - 1]}`
                              }
                              disabled={isPaid}
                            >
                              {isPaid ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(member.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.monthsOwing.length > 0 ? (
                          <Badge variant="destructive" className="font-normal">
                            {member.monthsOwing.length} mo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-normal text-green-600 border-green-200"
                          >
                            Clear
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Due Payment</DialogTitle>
            <DialogDescription>
              {selectedMember && selectedMonth && (
                <>
                  Record payment for{" "}
                  <strong>
                    {selectedMember.firstName} {selectedMember.lastName}
                  </strong>{" "}
                  — {MONTH_NAMES[selectedMonth - 1]} {duesOverview.year}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={isPending}>
              {isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Due Amount Dialog */}
      <Dialog open={dueAmountDialogOpen} onOpenChange={setDueAmountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Monthly Due Amount</DialogTitle>
            <DialogDescription>
              Set the expected monthly due amount for this society. This is used
              to calculate outstanding balances.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDueAmountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDueAmount} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
