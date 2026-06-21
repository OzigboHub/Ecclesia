"use client";

import {
  updateSocietyDueAmount,
  type MemberDuesStatus,
} from "@/app/actions/society.actions";
import { initializePaystackPayment } from "@/app/actions/paystack.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { CreditCard, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

interface DuesOverviewTabProps {
  societyId: string;
  duesOverview: {
    members: MemberDuesStatus[];
    monthlyDueAmount: number | null;
    year: number;
  };
  userEmail: string;
}

export function DuesOverviewTab({
  societyId,
  duesOverview,
  userEmail,
}: DuesOverviewTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recordDialogOpen, setRecordDialogOpen] = React.useState(false);
  const [dueAmountDialogOpen, setDueAmountDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] =
    React.useState<MemberDuesStatus | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [dueAmount, setDueAmount] = React.useState(
    duesOverview.monthlyDueAmount?.toString() || "",
  );
  const [filter, setFilter] = React.useState<"all" | "owing" | "paid">("all");

  const filteredMembers = duesOverview.members.filter((m) => {
    if (filter === "owing") return m.monthsOwing.length > 0;
    if (filter === "paid") return m.monthsOwing.length === 0;
    return true;
  });

  const handleOpenRecordDialog = (member: MemberDuesStatus) => {
    setSelectedMember(member);
    setPaymentAmount(duesOverview.monthlyDueAmount?.toString() || "");
    setRecordDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedMember || !paymentAmount) return;
    
    const email = selectedMember.email || userEmail;
    if (!email) {
      toast.error("An email address is required to process Paystack payment.");
      return;
    }

    startTransition(async () => {
      const result = await initializePaystackPayment({
        amount: parseFloat(paymentAmount),
        purpose: "SOCIETY_DUES",
        societyId,
        email,
        parishionerId: selectedMember.parishionerId,
        payerName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      });
      if (result.success && result.data) {
        toast.success("Redirecting to Paystack...");
        window.location.href = result.data.authorizationUrl;
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
                  <TableHead>Member</TableHead>
                  <TableHead className="text-center">Months Paid</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Next Payment Expected</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No members to display.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.parishionerId}>
                      <TableCell className="font-medium">
                        <div>
                          {member.firstName} {member.lastName}
                        </div>
                        {member.phone && (
                          <div className="text-xs text-muted-foreground">
                            {member.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {member.monthsPaid.length} mo
                      </TableCell>
                      <TableCell className="text-center">
                        {member.monthsOwing.length > 0 ? (
                          <Badge variant="destructive" className="font-normal">
                            {member.monthsOwing.length} mo owing
                          </Badge>
                        ) : member.futureMonthsPaid > 0 ? (
                          <Badge
                            variant="outline"
                            className="font-normal text-blue-600 border-blue-200 bg-blue-50/50"
                          >
                            {member.futureMonthsPaid} mo ahead
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-normal text-green-600 border-green-200 bg-green-50/50"
                          >
                            Clear
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {member.nextPaymentDate || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(member.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRecordDialog(member)}
                          className="h-8 text-xs"
                        >
                          <CreditCard className="mr-2 h-3.5 w-3.5 text-primary" />
                          Collect
                        </Button>
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
            <DialogTitle>Collect Dues via Paystack</DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <>
                  Initialize a Paystack payment for{" "}
                  <strong>
                    {selectedMember.firstName} {selectedMember.lastName}
                  </strong>{" "}
                  for the year {duesOverview.year}. You will be redirected to complete the payment.
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
                placeholder="Enter amount to pay"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted p-3 text-sm">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Payment Method</p>
              <p className="mt-1 font-medium flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-primary" /> Online Payment (Paystack)
              </p>
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
              {isPending ? "Redirecting..." : "Proceed to Paystack"}
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
