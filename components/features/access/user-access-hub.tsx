'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Church,
    Users,
    Heart,
    ArrowRight,
    Loader2,
    ChevronRight,
    Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getAccessibleEntities, type AccessibleEntities } from '@/app/actions/access.actions';

export function UserAccessHub() {
    const [data, setData] = useState<AccessibleEntities | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const result = await getAccessibleEntities();
            if (result.success && result.data) {
                setData(result.data);
            }
            setIsLoading(false);
        }
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data || (!data.organization && data.societies.length === 0 && data.activeCampaigns.length === 0)) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <section className="py-12 bg-muted/30 border-y">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Welcome Back</h2>
                        <p className="text-muted-foreground mt-1">Quick access to your parish activities</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/dashboard">
                            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Organization Access */}
                    {data.organization && (
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Church className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg truncate">{data.organization.name}</CardTitle>
                                    <CardDescription>{data.organization.role.replace('_', ' ')}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <Link href="/dashboard">Enter Parish Office</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Societies Access */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">My Societies</CardTitle>
                                <CardDescription>{data.societies.length} Joined</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data.societies.length > 0 ? (
                                    data.societies.slice(0, 2).map((society) => (
                                        <Link
                                            key={society.id}
                                            href={`/dashboard/societies/${society.id}`}
                                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent group transition-colors"
                                        >
                                            <span className="text-sm font-medium">{society.name}</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground py-2 text-center">No societies joined yet.</p>
                                )}
                                <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary">
                                    <Link href="/dashboard/societies">View All Societies</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Campaigns Hub */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Heart className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Active Campaigns</CardTitle>
                                <CardDescription>Support your parish</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.activeCampaigns.length > 0 ? (
                                    data.activeCampaigns.map((campaign) => {
                                        const progress = Math.min(100, (campaign.raisedAmount / campaign.targetAmount) * 100);
                                        return (
                                            <div key={campaign.id} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-medium truncate mr-2">{campaign.name}</span>
                                                    <span className="text-muted-foreground">{Math.round(progress)}%</span>
                                                </div>
                                                <Progress value={progress} className="h-1.5" />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground py-2 text-center">No active campaigns.</p>
                                )}
                                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                                    <Link href="/dashboard/payments">
                                        <Wallet className="mr-2 h-4 w-4" /> Make a Donation
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
