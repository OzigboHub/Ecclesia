"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  configureOrganizationPaystackProfile,
  requestOrganizationWithdrawal,
  type PaystackBank,
} from "@/app/actions/paystack.actions";
import { Button } from "@/components/ui/button";
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

type WalletSummary = {
  totalReceived: number;
  totalReserved: number;
  availableBalance: number;
  recentWithdrawals?: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string | Date;
  }>;
};

type PaymentProfile = {
  id: string;
  name: string;
  payoutBankCode?: string | null;
  payoutBankName?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  paystackSubaccountCode?: string | null;
  paystackSubaccountStatus?: string | null;
  paystackTransferRecipientCode?: string | null;
  paystackDedicatedAccountNumber?: string | null;
  paystackDedicatedBankName?: string | null;
  paystackDedicatedProviderSlug?: string | null;
};

interface PaystackWalletPanelProps {
  profile?: PaymentProfile;
  wallet?: WalletSummary;
  canManage: boolean;
  banks?: PaystackBank[];
}

export function PaystackWalletPanel({
  profile,
  wallet,
  canManage,
  banks = [],
}: PaystackWalletPanelProps) {
  const router = useRouter();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);

  const [profileForm, setProfileForm] = useState({
    accountNumber: profile?.payoutAccountNumber || "",
    bankCode: profile?.payoutBankCode || "",
    bankName: profile?.payoutBankName || "",
    businessName: profile?.name || "",
    contactEmail: "",
    contactPhone: "",
    settlementSchedule: "manual",
    createDedicatedAccount: !profile?.paystackDedicatedAccountNumber,
    dedicatedProviderSlug:
      profile?.paystackDedicatedProviderSlug || "wema-bank",
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    notes: "",
  });

  async function handleSaveProfile() {
    if (!canManage) {
      toast.error("You do not have permission to configure wallet profile");
      return;
    }

    setIsSavingProfile(true);
    try {
      const result = await configureOrganizationPaystackProfile({
        accountNumber: profileForm.accountNumber,
        bankCode: profileForm.bankCode,
        bankName: profileForm.bankName,
        businessName: profileForm.businessName,
        contactEmail: profileForm.contactEmail,
        contactPhone: profileForm.contactPhone,
        settlementSchedule: profileForm.settlementSchedule,
        createDedicatedAccount: profileForm.createDedicatedAccount,
        dedicatedProviderSlug: profileForm.dedicatedProviderSlug,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Parish payout profile configured successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to configure payout profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleRequestWithdrawal() {
    if (!canManage) {
      toast.error("You do not have permission to request withdrawals");
      return;
    }

    const amount = Number(withdrawalForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid withdrawal amount");
      return;
    }

    setIsRequestingWithdrawal(true);
    try {
      const result = await requestOrganizationWithdrawal({
        amount,
        notes: withdrawalForm.notes || undefined,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setWithdrawalForm({ amount: "", notes: "" });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to request withdrawal");
    } finally {
      setIsRequestingWithdrawal(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Wallet Balance
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(wallet?.availableBalance || 0)}
          </p>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Total Received
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(wallet?.totalReceived || 0)}
          </p>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Reserved/Withdrawn
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(wallet?.totalReserved || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-background border border-border rounded-lg shadow-sm p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Paystack Parish Profile</h2>
            <p className="text-sm text-muted-foreground">
              Configure the parish account that receives withdrawals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Bank</Label>
              <Select
                value={profileForm.bankCode}
                onValueChange={(value) => {
                  const bank = banks.find((b) => b.code === value);
                  setProfileForm((prev) => ({
                    ...prev,
                    bankCode: value,
                    bankName: bank?.name || prev.bankName,
                  }));
                }}
                disabled={!canManage || isSavingProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-primary">
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Account Number</Label>
              <Input
                value={profileForm.accountNumber}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                disabled={!canManage || isSavingProfile}
                placeholder="10-digit account number"
              />
            </div>
            <div className="space-y-1">
              <Label>Business Name</Label>
              <Input
                value={profileForm.businessName}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    businessName: e.target.value,
                  }))
                }
                disabled={!canManage || isSavingProfile}
                placeholder="Parish legal/business name"
              />
            </div>
            <div className="space-y-1">
              <Label>Contact Email (optional)</Label>
              <Input
                type="email"
                value={profileForm.contactEmail}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                disabled={!canManage || isSavingProfile}
              />
            </div>
            <div className="space-y-1">
              <Label>Contact Phone (optional)</Label>
              <Input
                value={profileForm.contactPhone}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    contactPhone: e.target.value,
                  }))
                }
                disabled={!canManage || isSavingProfile}
              />
            </div>
            <div className="space-y-1">
              <Label>Settlement Schedule</Label>
              <Select
                value={profileForm.settlementSchedule}
                onValueChange={(value) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    settlementSchedule: value,
                  }))
                }
                disabled={!canManage || isSavingProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>DVA Provider</Label>
              <Select
                value={profileForm.dedicatedProviderSlug}
                onValueChange={(value) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    dedicatedProviderSlug: value,
                  }))
                }
                disabled={!canManage || isSavingProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wema-bank">Wema Bank</SelectItem>
                  <SelectItem value="access-bank">Access Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border p-3 text-sm space-y-1">
            <p>
              Subaccount Status:{" "}
              <span className="font-medium">
                {profile?.paystackSubaccountStatus || "Not Configured"}
              </span>
            </p>
            <p>
              Subaccount Code:{" "}
              <span className="font-mono">
                {profile?.paystackSubaccountCode || "-"}
              </span>
            </p>
            <p>
              Transfer Recipient:{" "}
              <span className="font-mono">
                {profile?.paystackTransferRecipientCode || "-"}
              </span>
            </p>
            <p>
              Dedicated Account:{" "}
              <span className="font-mono">
                {profile?.paystackDedicatedAccountNumber || "-"}
              </span>
              {profile?.paystackDedicatedBankName
                ? ` (${profile.paystackDedicatedBankName})`
                : ""}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={!canManage || isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save Paystack Profile"}
            </Button>
          </div>
        </div>

        <div className="bg-background border border-border rounded-lg shadow-sm p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Withdraw Funds</h2>
            <p className="text-sm text-muted-foreground">
              Sends transfer to your configured parish account immediately.
            </p>
          </div>

          <div className="space-y-1">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={withdrawalForm.amount}
              onChange={(e) =>
                setWithdrawalForm((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              disabled={!canManage || isRequestingWithdrawal}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={3}
              value={withdrawalForm.notes}
              onChange={(e) =>
                setWithdrawalForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              disabled={!canManage || isRequestingWithdrawal}
              placeholder="e.g. Weekly parish payout"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleRequestWithdrawal}
              disabled={!canManage || isRequestingWithdrawal}>
              {isRequestingWithdrawal ? "Requesting..." : "Request Withdrawal"}
            </Button>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <h3 className="text-sm font-semibold">Recent Withdrawals</h3>
            {(wallet?.recentWithdrawals?.length || 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No withdrawals yet.
              </p>
            ) : (
              <div className="space-y-2">
                {wallet?.recentWithdrawals?.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                        }).format(item.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary text-secondary-foreground">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
