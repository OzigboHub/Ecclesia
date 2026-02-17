import { getCampaign } from '@/app/actions/campaign.actions';
import { getPublicOrganization } from '@/app/actions/organization.actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { PublicPaymentForm } from '@/components/payments/public-payment-form';

export default async function PublicCampaignPage({
    params,
}: {
    params: Promise<{ parishId: string; id: string }>;
}) {
    const { parishId, id } = await params;
    if (!parishId || !id) {
        notFound();
    }

    const [campaignRes, orgRes] = await Promise.all([
        getCampaign(id, parishId),
        getPublicOrganization(parishId),
    ]);

    if (!campaignRes.success || !orgRes.success) {
        notFound();
    }

    const campaign = campaignRes.data;
    const organization = orgRes.data;

    const currencyFormatter = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <Badge variant="secondary" className="mb-2">
                    Donation Campaign
                </Badge>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{campaign.name}</h1>
                <p className="text-lg text-slate-600 font-medium">{organization.name}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-3xl font-bold text-slate-900">
                                            {currencyFormatter.format(campaign.raisedAmount)}
                                        </span>
                                        <span className="text-slate-500 font-medium">
                                            raised of {currencyFormatter.format(campaign.targetAmount)}
                                        </span>
                                    </div>
                                    <Progress value={campaign.progress} className="h-4" />
                                    <div className="flex justify-between mt-2 text-sm font-medium">
                                        <span className="text-blue-600">{Math.round(campaign.progress)}% Funded</span>
                                        <span className="text-slate-500">{campaign._count.payments} Donors</span>
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none border-t pt-6">
                                    {campaign.description || 'No description provided.'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                                <div>
                                    <p className="font-semibold text-slate-900">Timeline</p>
                                    <p className="text-slate-600">Started: {format(new Date(campaign.startDate), 'MMM do, yyyy')}</p>
                                    {campaign.endDate && (
                                        <p className="text-slate-600">Ends: {format(new Date(campaign.endDate), 'MMM do, yyyy')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 border-t pt-4">
                                <Target className="w-5 h-5 text-slate-400 mt-1" />
                                <div>
                                    <p className="font-semibold text-slate-900">Target</p>
                                    <p className="text-slate-600">{currencyFormatter.format(campaign.targetAmount)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Section */}
                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center text-blue-800">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Make a Donation
                            </CardTitle>
                            <CardDescription>
                                Your contribution makes a difference. Give securely online.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PublicPaymentForm
                                organizationId={parishId}
                                donationCampaignId={id}
                                purpose="DONATION_CAMPAIGN"
                                title={campaign.name}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
