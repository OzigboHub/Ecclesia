"use client";

import type { SocietyPaymentRecord } from "@/app/actions/society.actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  REFUNDED: "outline",
};

interface PaymentRecordsTabProps {
  societyId: string;
  initialPayments: SocietyPaymentRecord[];
  total: number;
}

export function PaymentRecordsTab({
  initialPayments,
  total,
}: PaymentRecordsTabProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payment Records</h2>
        <p className="text-sm text-muted-foreground">{total} total records</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPayments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No payment records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  initialPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.parishioner
                          ? `${p.parishioner.firstName} ${p.parishioner.lastName}`
                          : p.payerName}
                      </TableCell>
                      <TableCell>
                        {p.month ? MONTH_NAMES[p.month - 1] : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs capitalize">
                          {p.paymentMethod.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[p.paymentStatus] || "outline"}>
                          {p.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(p.paymentDate)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.receiptNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.recordedBy
                          ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
