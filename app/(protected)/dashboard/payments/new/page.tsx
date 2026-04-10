"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from "@/lib/validators/payment.schema";
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

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function NewPaymentPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: 0,
      purpose: undefined,
      paymentMethod: "BANK_TRANSFER",
      payerName: "",
      onBehalfOf: "",
      payerEmail: "",
      payerPhone: "",
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
  const amount = watch("amount");

  const onSubmit = (data: CreatePaymentInput) => {
    startTransition(async () => {
      const result = await createPayment(data);

      if (result.success) {
        toast.success(result.message);
        router.push("/dashboard/payments");
        router.refresh();
      } else {
        toast.error(result.message);

        // Set server-side validation errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as keyof CreatePaymentInput, {
              type: "server",
              message: messages[0],
            });
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/payments">
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
                    {
                      shouldValidate: true,
                    },
                  )
                }
                disabled={isPending}>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  <SelectItem value="OFFERING">Offering</SelectItem>
                  <SelectItem value="TITHE">Tithe</SelectItem>
                  <SelectItem value="MASS_INTENTION">Mass Intention</SelectItem>
                  <SelectItem value="DONATION_CAMPAIGN">
                    Donation Campaign
                  </SelectItem>
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

            {/* Month (for offerings) */}
            {selectedPurpose === "OFFERING" && (
              <div className="space-y-2">
                <Label htmlFor="month">Month *</Label>
                <Select
                  value={watch("month")?.toString() || ""}
                  onValueChange={(value) =>
                    setValue("month", parseInt(value), {
                      shouldValidate: true,
                    })
                  }
                  disabled={isPending}>
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem
                        key={month.value}
                        value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.month && (
                  <p className="text-sm text-destructive">
                    {errors.month.message}
                  </p>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={watch("paymentMethod") || "CASH"}
                onValueChange={(value) =>
                  setValue(
                    "paymentMethod",
                    value as unknown as CreatePaymentInput["paymentMethod"],
                    {
                      shouldValidate: true,
                    },
                  )
                }
                disabled={isPending}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-destructive">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Payer Information</h3>

              {/* Payer Name */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payerName">Payer Name *</Label>
                  <Input
                    id="payerName"
                    {...register("payerName")}
                    placeholder="Enter payer name"
                    disabled={isPending}
                  />
                  {errors.payerName && (
                    <p className="text-sm text-destructive">
                      {errors.payerName.message}
                    </p>
                  )}
                </div>

                {/* On Behalf Of */}
                <div className="space-y-2">
                  <Label htmlFor="onBehalfOf">On Behalf Of (Optional)</Label>
                  <Input
                    id="onBehalfOf"
                    {...register("onBehalfOf")}
                    placeholder="e.g., The Smith Family"
                    disabled={isPending}
                  />
                  {errors.onBehalfOf && (
                    <p className="text-sm text-destructive">
                      {errors.onBehalfOf.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="payerEmail">Email (Optional)</Label>
                  <Input
                    id="payerEmail"
                    type="email"
                    {...register("payerEmail")}
                    placeholder="email@example.com"
                    disabled={isPending}
                  />
                  {errors.payerEmail && (
                    <p className="text-sm text-destructive">
                      {errors.payerEmail.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="payerPhone">Phone (Optional)</Label>
                  <Input
                    id="payerPhone"
                    type="tel"
                    {...register("payerPhone")}
                    placeholder="08012345678"
                    disabled={isPending}
                  />
                  {errors.payerPhone && (
                    <p className="text-sm text-destructive">
                      {errors.payerPhone.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Format: 08012345678 or +2348012345678
                  </p>
                </div>
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

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
