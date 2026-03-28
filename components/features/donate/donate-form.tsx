"use client";

import { useState } from "react";
import { Heart, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
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
import Link from "next/link";

interface DonateFormProps {
    campaign: {
        id: string;
        name: string;
        description: string | null;
        targetAmount: number;
        raisedAmount: number;
        progress: number;
        organizationId: string;
        organization: { id: string; name: string };
    };
}

export function DonateForm({ campaign }: DonateFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        amount: "",
        paymentMethod: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const { createPayment } = await import(
                "@/app/actions/payment.actions"
            );

            const result = await createPayment(
                {
                    amount: parseFloat(formData.amount),
                    paymentMethod: formData.paymentMethod,
                    purpose: "DONATION_CAMPAIGN",
                    donationCampaignId: campaign.id,
                    description: `Donation to ${campaign.name} by ${formData.name}`,
                },
                campaign.organizationId
            );

            if (result.success) {
                setIsSubmitted(true);
            } else {
                setError(result.message || "Payment failed. Please try again.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="rounded-xl border bg-card p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">
                    Thank you for your generosity!
                </h2>
                <p className="mt-2 text-muted-foreground">
                    Your donation to{" "}
                    <span className="font-medium">{campaign.name}</span> has
                    been received.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campaign info */}
            <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Donating to</p>
                <h3 className="font-semibold">{campaign.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    {campaign.organization.name}
                </p>
                <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-700 dark:text-green-400 font-medium">
                            ₦{campaign.raisedAmount.toLocaleString()} raised
                        </span>
                        <span className="text-muted-foreground">
                            of ₦{campaign.targetAmount.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                            className="h-1.5 rounded-full bg-green-500"
                            style={{
                                width: `${Math.min(100, campaign.progress)}%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                    id="name"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                    id="amount"
                    type="number"
                    required
                    min="100"
                    step="100"
                    placeholder="5,000"
                    value={formData.amount}
                    onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                    }
                />
                <div className="flex gap-2 mt-1">
                    {[1000, 5000, 10000, 50000].map((amt) => (
                        <button
                            key={amt}
                            type="button"
                            onClick={() =>
                                setFormData({
                                    ...formData,
                                    amount: String(amt),
                                })
                            }
                            className="rounded-md border px-3 py-1 text-xs hover:bg-accent transition-colors"
                        >
                            ₦{amt.toLocaleString()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) =>
                        setFormData({ ...formData, paymentMethod: v })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                            Bank Transfer
                        </SelectItem>
                        <SelectItem value="MOBILE_MONEY">
                            Mobile Money
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !formData.paymentMethod}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Heart className="mr-2 h-4 w-4" />
                        Donate ₦{formData.amount ? parseInt(formData.amount).toLocaleString() : "0"}
                    </>
                )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
                No sign-up required. Your donation goes directly to the parish.
            </p>
        </form>
    );
}
