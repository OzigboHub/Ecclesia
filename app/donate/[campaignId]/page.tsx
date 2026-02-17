import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Church } from "lucide-react";
import db from "@/lib/db";
import { DonateForm } from "@/components/features/donate/donate-form";

interface DonatePageProps {
    params: Promise<{ campaignId: string }>;
}

export default async function DonatePage({ params }: DonatePageProps) {
    const { campaignId } = await params;

    const campaign = await db.donationCampaign.findUnique({
        where: { id: campaignId },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!campaign || !campaign.isActive) {
        notFound();
    }

    // Calculate raised amount
    const raised = await db.payment.aggregate({
        where: {
            donationCampaignId: campaign.id,
            paymentStatus: "COMPLETED",
        },
        _sum: { amount: true },
    });

    const campaignWithProgress = {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        targetAmount: campaign.targetAmount,
        raisedAmount: raised._sum.amount || 0,
        progress:
            ((raised._sum.amount || 0) / campaign.targetAmount) * 100,
        organizationId: campaign.organizationId,
        organization: campaign.organization,
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Minimal nav */}
            <nav className="border-b bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </nav>

            <main className="mx-auto max-w-md px-4 py-12">
                <DonateForm campaign={campaignWithProgress} />
            </main>

            <footer className="border-t bg-muted/30">
                <div className="mx-auto max-w-6xl px-4 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Church className="h-4 w-4" />
                        <span>Powered by Ecclesia</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
