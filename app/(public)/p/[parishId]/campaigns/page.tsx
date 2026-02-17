import Link from 'next/link';
import db from '@/lib/db';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = await params;
  if (!parishId) {
    notFound();
  }

  // Verify organization exists
  const org = await db.organization.findUnique({
    where: { id: parishId },
    select: { id: true, name: true },
  });

  if (!org) {
    notFound();
  }

  // Get all active campaigns
  const campaigns = await db.donationCampaign.findMany({
    where: {
      organizationId: parishId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      targetAmount: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate campaign progress
  const campaignsWithProgress = await Promise.all(
    campaigns.map(async (c) => {
      const raised = await db.payment.aggregate({
        where: {
          donationCampaignId: c.id,
          paymentStatus: 'COMPLETED',
        },
        _sum: { amount: true },
      });
      return {
        ...c,
        raisedAmount: raised._sum.amount || 0,
        progress: Math.min(100, ((raised._sum.amount || 0) / c.targetAmount) * 100),
      };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-muted/30 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-3xl font-bold">Support {org.name}</h1>
          </div>
          <p className="text-muted-foreground">Active campaigns and fundraising initiatives</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {campaignsWithProgress.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaignsWithProgress.map((campaign) => (
              <div key={campaign.id} className="rounded-lg border bg-card overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {campaign.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">₦{campaign.raisedAmount.toLocaleString()}</span>
                      <span className="text-muted-foreground">
                        of ₦{campaign.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-red-500 transition-all"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(campaign.progress)}% of goal reached
                    </p>
                  </div>

                  {/* CTA */}
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/p/${parishId}/campaigns/${campaign.id}`}>
                      Contribute Now
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground mb-4">No active campaigns right now</p>
            <Button asChild variant="outline">
              <Link href={`/p/${parishId}`}>Back to {org.name}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
