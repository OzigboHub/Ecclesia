"use client";

import { useState } from "react";
import { initializePaystackPayment } from "@/app/actions/paystack.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Church,
  HandCoins,
  Heart,
  MoreHorizontal,
  ArrowLeft,
  CreditCard,
} from "lucide-react";

type PaymentTypeData = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
};

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Church; color: string }
> = {
  OFFERING: {
    label: "Offerings",
    icon: Church,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  TITHE: {
    label: "Tithes",
    icon: HandCoins,
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  DONATION: {
    label: "Donations",
    icon: Heart,
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
  OTHER: {
    label: "Other",
    icon: MoreHorizontal,
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

interface PayClientProps {
  paymentTypes: PaymentTypeData[];
  userEmail: string;
  userName: string;
  parishionerId: string | null;
  organizationId: string;
}

export function PayClient({
  paymentTypes,
  userEmail,
  userName,
  parishionerId,
  organizationId,
}: PayClientProps) {
  const [selectedType, setSelectedType] = useState<PaymentTypeData | null>(
    null,
  );
  const [amount, setAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group by category
  const categories = Object.entries(CATEGORY_META)
    .map(([key, meta]) => ({
      key,
      ...meta,
      items: paymentTypes.filter((pt) => pt.category === key),
    }))
    .filter((group) => group.items.length > 0);

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

  async function handlePay() {
    if (!selectedType || amount <= 0) return;

    if (!userEmail) {
      toast.error("Email is required for online payment");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await initializePaystackPayment(
        {
          amount,
          email: userEmail,
          purpose: mapCategoryToPurpose(selectedType.category),
          payerName: userName || "Parishioner",
          parishionerId: parishionerId || undefined,
          paymentTypeId: selectedType.id,
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

  // Payment form view
  if (selectedType) {
    const meta = CATEGORY_META[selectedType.category] || CATEGORY_META.OTHER;
    const Icon = meta.icon;

    return (
      <div className="max-w-md mx-auto space-y-6">
        <button
          onClick={() => {
            setSelectedType(null);
            setAmount(0);
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to payment types
        </button>

        <div className={`rounded-lg border p-6 space-y-1 ${meta.color}`}>
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <h2 className="text-lg font-semibold">{selectedType.name}</h2>
              <Badge variant="outline" className="text-xs">
                {meta.label}
              </Badge>
            </div>
          </div>
          {selectedType.description && (
            <p className="text-sm opacity-80 pt-2">
              {selectedType.description}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (₦)</label>
            <Input
              type="number"
              placeholder="Enter amount"
              min={1}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              Enter any amount you wish to pay
            </p>
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2000, 5000, 10000].map((preset) => (
              <Button
                key={preset}
                variant={amount === preset ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(preset)}>
                ₦{preset.toLocaleString("en-NG")}
              </Button>
            ))}
          </div>

          <Button
            className="w-full h-12 text-base"
            onClick={handlePay}
            disabled={isSubmitting || amount <= 0}>
            {isSubmitting ? (
              <Spinner className="h-5 w-5 mr-2" />
            ) : (
              <CreditCard className="h-5 w-5 mr-2" />
            )}
            {amount > 0
              ? `Pay ₦${amount.toLocaleString("en-NG")}`
              : "Enter an amount"}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Secured by Paystack. Bank charges apply at checkout.
          </p>
        </div>
      </div>
    );
  }

  // Category selection view
  return (
    <div className="space-y-6">
      {paymentTypes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No payment types available</p>
          <p className="text-sm">
            Your parish has not set up any payment types yet. Please check back
            later.
          </p>
        </div>
      )}

      {categories.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{group.label}</h2>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setSelectedType(pt)}
                  className={`rounded-lg border p-4 text-left hover:border-primary hover:shadow-sm transition-all ${group.color}`}>
                  <h3 className="font-medium">{pt.name}</h3>
                  {pt.description && (
                    <p className="text-sm opacity-70 mt-1">{pt.description}</p>
                  )}
                  <p className="text-xs mt-2 font-medium opacity-60">
                    Tap to pay →
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
