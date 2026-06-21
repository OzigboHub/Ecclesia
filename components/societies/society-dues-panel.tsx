"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { initializePaystackPayment } from "@/app/actions/paystack.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import type { SocietyMemberDues } from "@/app/actions/society.actions";

interface SocietyDuesPanelProps {
  societyId: string;
  dues: SocietyMemberDues;
  userEmail?: string;
  userName?: string;
}

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

export function SocietyDuesPanel({ societyId, dues, userEmail, userName }: SocietyDuesPanelProps) {
  const defaultMonths = Math.max(1, dues.monthsOwing.length);
  const [monthsToPay, setMonthsToPay] = useState<number>(defaultMonths);
  const [amount, setAmount] = useState(
    dues.monthlyDueAmount ? (dues.monthlyDueAmount * defaultMonths).toString() : "0",
  );
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Helper to update amount when months change
  const handleMonthsChange = (val: string) => {
    const num = Number(val);
    setMonthsToPay(num);
    if (dues.monthlyDueAmount) {
      setAmount((dues.monthlyDueAmount * num).toString());
    }
  };

  const owingText = dues.monthsOwing.length
    ? `${dues.monthsOwing.length} month${dues.monthsOwing.length > 1 ? "s" : ""} owing`
    : "No outstanding dues";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userEmail) {
      toast.error("Email is required for online payment");
      return;
    }

    if (!userName) {
      toast.error("Name is required for payment");
      return;
    }

    startTransition(async () => {
      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        toast.error("Enter a valid due amount.");
        return;
      }

      const result = await initializePaystackPayment({
        amount: parsedAmount,
        purpose: "SOCIETY_DUES",
        societyId,
        email: userEmail,
        payerName: userName,
      });

      if (result.success && result.data) {
        toast.success("Redirecting to payment...");
        // Redirect to Paystack checkout
        window.location.href = result.data.authorizationUrl;
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Society Dues</CardTitle>
            <CardDescription>
              {dues.monthlyDueAmount
                ? `Pay monthly dues for ${dues.societyName}`
                : "Monthly dues are not configured for this society."}
            </CardDescription>
          </div>
          <Badge
            className="self-start"
            variant={dues.totalOwing > 0 ? "destructive" : "secondary"}>
            {owingText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Monthly Due
              </p>
              <p className="font-semibold">
                {dues.monthlyDueAmount
                  ? new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(dues.monthlyDueAmount)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Paid (Year)
              </p>
              <p className="font-semibold text-green-600">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(dues.totalPaid)}
              </p>
            </div>
          </div>

          {dues.nextPaymentDate && (
            <div className={`mt-1 rounded-lg border p-3 flex items-center justify-between ${
              dues.totalOwing > 0 
                ? "border-destructive/20 bg-destructive/5" 
                : "border-emerald-500/20 bg-emerald-500/5"
            }`}>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {dues.totalOwing > 0 ? "Next Payment Due (Oldest)" : "Next Payment Expected"}
                </p>
                <p className={`font-semibold ${
                  dues.totalOwing > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {dues.nextPaymentDate}
                </p>
              </div>
              {dues.futureMonthsPaid > 0 ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent">
                  {dues.futureMonthsPaid} mo ahead
                </Badge>
              ) : dues.totalOwing > 0 ? (
                <Badge variant="destructive">
                  Owing
                </Badge>
              ) : (
                <Badge className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-50">
                  Up to Date
                </Badge>
              )}
            </div>
          )}

          {dues.totalOwing > 0 && (
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm font-medium">Outstanding months</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {dues.monthsOwing.map((month) => (
                  <Badge key={month} variant="outline">
                    {MONTH_NAMES[month - 1]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {dues.monthlyDueAmount ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthsToPay">Months to Pay</Label>
                <Select
                  value={monthsToPay.toString()}
                  onValueChange={handleMonthsChange}>
                  <SelectTrigger id="monthsToPay">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Month{num > 1 ? "s" : ""}
                        {num === dues.monthsOwing.length ? " (Clear Outstanding)" : ""}
                        {num === 12 ? " (Full Year)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="rounded-lg border border-border bg-muted p-3 text-sm">
                  <p className="font-medium">Online Payment (Card)</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pay securely online using Paystack. You will be redirected to
                  complete payment.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add a note for this dues payment (optional)"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total owing</p>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    maximumFractionDigits: 0,
                  }).format(dues.totalOwing)}
                </p>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}>
                <Wallet className="mr-2 h-4 w-4" />
                Pay Dues
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            Monthly dues are not configured yet for this society. Ask your
            leader to set the dues amount.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
