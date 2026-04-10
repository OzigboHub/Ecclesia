"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from "@/lib/validators/payment.schema";
import { createPayment } from "@/app/actions/payment.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PaymentFormProps {
  onSuccess?: () => void;
}

export function PaymentForm({ onSuccess }: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: 0,
      purpose: undefined,
      paymentMethod: undefined,
      payerName: "",
      payerEmail: "",
      payerPhone: "",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    reset,
    watch,
  } = form;

  const onSubmit = (data: CreatePaymentInput) => {
    startTransition(async () => {
      const result = await createPayment(data);

      if (result.success) {
        toast.success(result.message);
        reset();
        router.refresh();
        onSuccess?.();
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
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Amount in Nigerian Naira */}
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
            {...register("amount", { valueAsNumber: true })}
            className="pl-8"
            placeholder="0.00"
            disabled={isPending}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "amount-error" : undefined}
          />
        </div>
        {errors.amount && (
          <p id="amount-error" className="text-sm text-destructive">
            {errors.amount.message}
          </p>
        )}
        {watch("amount") > 0 && (
          <p className="text-sm text-muted-foreground">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(watch("amount"))}
          </p>
        )}
      </div>

      {/* Purpose */}
      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Controller
          name="purpose"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isPending}>
              <SelectTrigger id="purpose" aria-invalid={!!errors.purpose}>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OFFERING">Offering</SelectItem>
                <SelectItem value="TITHE">Tithe</SelectItem>
                <SelectItem value="MASS_INTENTION">Mass Intention</SelectItem>
                <SelectItem value="DONATION_CAMPAIGN">
                  Donation Campaign
                </SelectItem>
                <SelectItem value="CUSTOM_DONATION">Custom Donation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.purpose && (
          <p className="text-sm text-destructive">{errors.purpose.message}</p>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method *</Label>
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isPending}>
              <SelectTrigger
                id="paymentMethod"
                aria-invalid={!!errors.paymentMethod}>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="bg-primary">
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.paymentMethod && (
          <p className="text-sm text-destructive">
            {errors.paymentMethod.message}
          </p>
        )}
      </div>

      {/* Payer Name */}
      <div className="space-y-2">
        <Label htmlFor="payerName">Payer Name *</Label>
        <Input
          id="payerName"
          {...register("payerName")}
          placeholder="Who is making the payment?"
          disabled={isPending}
          aria-invalid={!!errors.payerName}
          aria-describedby={errors.payerName ? "payerName-error" : undefined}
        />
        {errors.payerName && (
          <p id="payerName-error" className="text-sm text-destructive">
            {errors.payerName.message}
          </p>
        )}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Any additional details about this payment..."
          rows={3}
          disabled={isPending}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isPending}>
          Reset
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Recording..." : "Record Payment"}
        </Button>
      </div>
    </form>
  );
}
