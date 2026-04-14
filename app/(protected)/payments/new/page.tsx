"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from "@/lib/validators/payment.schema";
import { initializePaystackPayment } from "@/app/actions/paystack.actions";
import { createPayment } from "@/app/actions/payment.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPaymentPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { data: session } = useSession();

  const loggedInName = session?.user?.name ?? "";
  const loggedInEmail = session?.user?.email ?? "";

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: 0,
      purpose: undefined,
      paymentMethod: "CARD",
      payerName: loggedInName,
      onBehalfOf: "",
      paymentDate: "",
      description: "",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = form;

  const selectedPurpose = watch("purpose");
  const selectedMethod = watch("paymentMethod");
  const amount = watch("amount");

  // Keep payerName in sync with session
  if (loggedInName && form.getValues("payerName") !== loggedInName) {
    form.setValue("payerName", loggedInName);
  }

  const needsDescription =
    selectedPurpose === "CUSTOM_DONATION" || selectedPurpose === "OTHER";
  const isOnlinePayment =
    selectedMethod === "CARD" || selectedMethod === "BANK_TRANSFER";

  const onSubmit = (data: CreatePaymentInput) => {
    startTransition(async () => {
      // Auto-derive month from paymentDate for offerings
      if (data.paymentDate) {
        data.month =
          new Date(data.paymentDate as string).getMonth() + 1;
      }

      if (isOnlinePayment && loggedInEmail) {
        // Online payment → redirect to Paystack
        const result = await initializePaystackPayment({
          amount: data.amount,
          email: loggedInEmail,
          purpose: data.purpose,
          payerName: data.payerName || loggedInName || "Parishioner",
          parishionerId: session?.user?.parishionerId || undefined,
          paymentTypeId: undefined,
        });

        if (result.success) {
          const authUrl = (result.data as { authorizationUrl?: string })
            ?.authorizationUrl;
          if (authUrl) {
            window.location.href = authUrl;
            return;
          }
          toast.error("Payment gateway URL was not returned");
        } else {
          toast.error(result.message);
        }
      } else {
        // Cash payment → record directly
        const result = await createPayment(data);

        if (result.success) {
          toast.success(result.message);
          router.push("/payments");
          router.refresh();
        } else {
          toast.error(result.message);
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              setError(field as keyof CreatePaymentInput, {
                type: "server",
                message: messages[0],
              });
            });
          }
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/payments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record New Payment</h1>
          <p className="text-muted-foreground">
            Record a payment from a parishioner or donor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("amount", {
                    valueAsNumber: true,
                  })}
                  className="pl-8"
                  placeholder="0.00"
                  disabled={isPending}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
              {amount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(amount)}
                </p>
              )}
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Select
                value={watch("purpose") || ""}
                onValueChange={(value) =>
                  setValue(
                    "purpose",
                    value as unknown as CreatePaymentInput["purpose"],
                    { shouldValidate: true },
                  )
                }
                disabled={isPending}>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  <SelectItem value="OFFERING">Offering</SelectItem>
                  <SelectItem value="TITHE">Tithe</SelectItem>
                  <SelectItem value="CUSTOM_DONATION">
                    Custom Donation
                  </SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.purpose && (
                <p className="text-sm text-destructive">
                  {errors.purpose.message}
                </p>
              )}
            </div>

            {/* Description (for Custom Donation / Other) */}
            {needsDescription && (
              <div className="space-y-2">
                <Label htmlFor="description">What is this payment for? *</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder={
                    selectedPurpose === "CUSTOM_DONATION"
                      ? "e.g., Church building fund"
                      : "e.g., Catechism registration fee"
                  }
                  disabled={isPending}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            )}

            {/* Payment Date (for offerings — full date) */}
            {selectedPurpose === "OFFERING" && (
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  {...register("paymentDate")}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  The date this offering was made
                </p>
                {errors.paymentDate && (
                  <p className="text-sm text-destructive">
                    {errors.paymentDate.message}
                  </p>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={watch("paymentMethod") || "CARD"}
                onValueChange={(value) =>
                  setValue(
                    "paymentMethod",
                    value as unknown as CreatePaymentInput["paymentMethod"],
                    { shouldValidate: true },
                  )
                }
                disabled={isPending}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  <SelectItem value="CARD">Pay Online (Card/Bank)</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-destructive">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            {/* Payer Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Payer Information</h3>

              <div className="space-y-4">
                {/* Recorded By (locked to logged-in user) */}
                <div className="space-y-2">
                  <Label htmlFor="payerName">Recorded By</Label>
                  <Input
                    id="payerName"
                    value={loggedInName}
                    disabled
                    className="bg-muted"
                  />
                  <input type="hidden" {...register("payerName")} />
                  <p className="text-xs text-muted-foreground">
                    Locked to the logged-in user for tracking purposes
                  </p>
                </div>

                {/* On Behalf Of */}
                {/* <div className="space-y-2">
                  <Label htmlFor="onBehalfOf">On Behalf Of</Label>
                  <Input
                    id="onBehalfOf"
                    {...register("onBehalfOf")}
                    placeholder="Name of the person this payment is for"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    The parishioner or person this payment is for
                  </p>
                  {errors.onBehalfOf && (
                    <p className="text-sm text-destructive">
                      {errors.onBehalfOf.message}
                    </p>
                  )}
                </div> */}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                {...register("notes")}
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Any additional notes..."
                disabled={isPending}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Processing..."
                  : isOnlinePayment
                    ? "Pay Now"
                    : "Record Payment"}
              </Button>
            </div>

            {isOnlinePayment && (
              <p className="text-[10px] text-center text-muted-foreground">
                Secured by Paystack. Bank charges apply at checkout.
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
