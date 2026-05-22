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
  const [selectedMonth, setSelectedMonth] = useState<number>(
    dues.nextDueMonth || dues.monthsOwing[0] || new Date().getMonth() + 1,
  );
  const [amount, setAmount] = useState(
    dues.monthlyDueAmount ? dues.monthlyDueAmount.toString() : "0",
  );
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        month: selectedMonth,
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
                Month due
              </p>
              <p className="font-semibold">{MONTH_NAMES[selectedMonth - 1]}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Amount due
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
          </div>

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
                <Label htmlFor="month">Month *</Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(Number(value))}>
                  <SelectTrigger id="month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dues.monthsOwing.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {MONTH_NAMES[month - 1]}
                      </SelectItem>
                    ))}
                    {dues.monthsOwing.length === 0 && (
                      <SelectItem value={selectedMonth.toString()}>
                        {MONTH_NAMES[selectedMonth - 1]}
                      </SelectItem>
                    )}
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
                disabled={isPending || dues.monthsOwing.length === 0}>
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
