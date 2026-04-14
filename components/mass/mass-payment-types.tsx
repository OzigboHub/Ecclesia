"use client";

import { useState, useEffect } from "react";
import {
  getMassPaymentTypes,
  setMassPaymentTypes,
  getActivePaymentTypes,
} from "@/app/actions/payment-type.actions";
import { initializePaystackPayment } from "@/app/actions/paystack.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Check, HandCoins, CreditCard, ArrowLeft, X } from "lucide-react";

interface MassPaymentTypesManagerProps {
  massId: string;
  canManage: boolean;
  userEmail?: string;
  userName?: string;
  parishionerId?: string | null;
  organizationId?: string;
}

type PaymentTypeItem = {
  id: string;
  name: string;
  category: string;
};

function mapCategoryToPurpose(
  category: string,
): "OFFERING" | "TITHE" | "CUSTOM_DONATION" | "OTHER" {
  switch (category) {
    case "OFFERING":
      return "OFFERING";
    case "TITHE":
      return "TITHE";
    case "DONATION":
      return "CUSTOM_DONATION";
    default:
      return "OTHER";
  }
}

export function MassPaymentTypesManager({
  massId,
  canManage,
  userEmail,
  userName,
  parishionerId,
  organizationId,
}: MassPaymentTypesManagerProps) {
  const [allTypes, setAllTypes] = useState<PaymentTypeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Pay flow state
  const [payingType, setPayingType] = useState<PaymentTypeItem | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [massId]);

  async function loadData() {
    setLoading(true);
    const [allResult, currentResult] = await Promise.all([
      getActivePaymentTypes(),
      getMassPaymentTypes(massId),
    ]);

    if (allResult.success) {
      setAllTypes(allResult.data as PaymentTypeItem[]);
    }
    if (currentResult.success) {
      const current = currentResult.data as PaymentTypeItem[];
      setSelectedIds(new Set(current.map((pt) => pt.id)));
    }
    setLoading(false);
  }

  function toggleType(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const result = await setMassPaymentTypes({
      massId,
      paymentTypeIds: Array.from(selectedIds),
    });
    if (result.success) {
      toast.success("Mass payment types updated");
      setDirty(false);
    } else {
      toast.error(result.message);
    }
    setSaving(false);
  }

  async function handlePay() {
    if (!payingType || payAmount <= 0 || !userEmail) return;

    setIsSubmitting(true);
    try {
      const result = await initializePaystackPayment(
        {
          amount: payAmount,
          email: userEmail,
          purpose: mapCategoryToPurpose(payingType.category),
          payerName: userName || "Parishioner",
          parishionerId: parishionerId || undefined,
          paymentTypeId: payingType.id,
        },
        organizationId,
      );

      if (result.success) {
        const authorizationUrl = (
          result.data as { authorizationUrl?: string } | undefined
        )?.authorizationUrl;
        if (authorizationUrl) {
          window.location.href = authorizationUrl;
          return;
        }
        toast.error("Payment gateway URL was not returned");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Spinner className="h-4 w-4" />
        Loading payment types...
      </div>
    );
  }

  if (allTypes.length === 0) {
    return null;
  }

  // Inline pay form when a type is selected for payment
  if (payingType) {
    return (
      <div className="mt-3 pt-3 border-t space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Pay: <span className="text-primary">{payingType.name}</span>
          </p>
          <button
            onClick={() => {
              setPayingType(null);
              setPayAmount(0);
            }}
            className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Amount (₦)"
            min={1}
            value={payAmount || ""}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            className="h-9"
          />
          <Button
            size="sm"
            className="h-9 shrink-0"
            onClick={handlePay}
            disabled={isSubmitting || payAmount <= 0}>
            {isSubmitting ? (
              <Spinner className="h-3 w-3 mr-1" />
            ) : (
              <CreditCard className="h-3 w-3 mr-1" />
            )}
            Pay
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[500, 1000, 2000, 5000].map((preset) => (
            <button
              key={preset}
              onClick={() => setPayAmount(preset)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                payAmount === preset
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:border-primary/50"
              }`}>
              ₦{preset.toLocaleString("en-NG")}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground">
          Bank charges apply at checkout.
        </p>
      </div>
    );
  }

  // View-only mode for parishioners (with pay action)
  if (!canManage) {
    const linked = allTypes.filter((t) => selectedIds.has(t.id));
    if (linked.length === 0) return null;

    const canPay = !!userEmail && !!organizationId;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {linked.map((t) => (
          <button
            key={t.id}
            disabled={!canPay}
            onClick={() => canPay && setPayingType(t)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
              canPay
                ? "hover:bg-primary/10 hover:border-primary/50 cursor-pointer"
                : ""
            }`}>
            <HandCoins className="h-3 w-3" />
            {t.name}
            {canPay && <CreditCard className="h-3 w-3 ml-0.5 text-primary" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-3 pt-3 border-t">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Payment Types for this Mass
      </p>
      <div className="flex flex-wrap gap-2">
        {allTypes.map((t) => {
          const isSelected = selectedIds.has(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggleType(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:border-primary/50"
              }`}>
              {isSelected && <Check className="h-3 w-3" />}
              {t.name}
            </button>
          );
        })}
      </div>
      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Spinner className="h-3 w-3 mr-1" />}
          Save Changes
        </Button>
      )}
    </div>
  );
}
