"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createParishFinancialEntrySchema,
  type CreateParishFinancialEntryInput,
  ENTRY_TYPE_LABELS,
  parishFinancialEntryTypes,
} from "@/lib/validators/parish-financial.schema";
import { createParishFinancialEntry } from "@/app/actions/parish-financial.actions";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewParishFinancialEntryPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateParishFinancialEntryInput>({
    resolver: zodResolver(createParishFinancialEntrySchema),
    defaultValues: {
      entryType: undefined,
      customTitle: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
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

  const selectedType = watch("entryType");
  const amount = watch("amount");

  const onSubmit = (data: CreateParishFinancialEntryInput) => {
    startTransition(async () => {
      const result = await createParishFinancialEntry(data);

      if (result.success) {
        toast.success(result.message);
        router.push("/parish-finances");
        router.refresh();
      } else {
        toast.error(result.message);
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as keyof CreateParishFinancialEntryInput, {
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
          <Link href="/parish-finances">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl md:text-3xl font-bold">
            Record Financial Entry
          </h1>
          <p className="text-muted-foreground">
            Record a parish collection or financial entry. Backdating is
            supported.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Entry Type */}
            <div className="space-y-2">
              <Label htmlFor="entryType">Entry Type *</Label>
              <Select
                value={watch("entryType") || ""}
                onValueChange={(value) =>
                  setValue(
                    "entryType",
                    value as CreateParishFinancialEntryInput["entryType"],
                    { shouldValidate: true },
                  )
                }
                disabled={isPending}>
                <SelectTrigger id="entryType">
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent className="bg-primary">
                  {parishFinancialEntryTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ENTRY_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entryType && (
                <p className="text-sm text-destructive">
                  {errors.entryType.message}
                </p>
              )}
            </div>

            {/* Custom Title - shown only for "OTHER" type */}
            {selectedType === "OTHER" && (
              <div className="space-y-2">
                <Label htmlFor="customTitle">Title *</Label>
                <Input
                  id="customTitle"
                  {...register("customTitle")}
                  placeholder="e.g. Building Fund, Harvest Collection"
                  disabled={isPending}
                />
                {errors.customTitle && (
                  <p className="text-sm text-destructive">
                    {errors.customTitle.message}
                  </p>
                )}
              </div>
            )}

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
                  {...register("amount", { valueAsNumber: true })}
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

            {/* Date - supports backdating */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                disabled={isPending}
              />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                You can select a past date to backdate the entry.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Additional notes about this entry"
                rows={3}
                disabled={isPending}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Recording..." : "Record Entry"}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={isPending}>
                <Link href="/parish-finances">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
