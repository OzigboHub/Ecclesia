'use server';

import { auth } from '@/auth';
import db from '@/lib/db';
import type { ActionResponse } from '@/types';

export interface AccessibleEntities {
    organization: {
        id: string;
        name: string;
        role: string;
    } | null;
    societies: {
        id: string;
        name: string;
        role: string;
    }[];
    activeCampaigns: {
        id: string;
        name: string;
        targetAmount: number;
        raisedAmount: number;
    }[];
}

/**
 * Get all entities a user has access to (Organization, Societies, Campaigns)
 */
export async function getAccessibleEntities(): Promise<ActionResponse<AccessibleEntities>> {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, message: 'Unauthorized' };
        }

        const userId = session.user.id;
        const orgId = session.user.organizationId;

        // 1. Get primary organization details
        const organization = orgId ? {
            id: orgId,
            name: session.user.organizationName || 'My Parish',
            role: session.user.role,
        } : null;

        // 2. Get Societies the user is a member of (via Parishioner record)
        let societies: { id: string; name: string; role: string }[] = [];
        if (session.user.parishionerId) {
            const memberships = await db.societyMembership.findMany({
                where: { parishionerId: session.user.parishionerId },
                include: {
                    society: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            societies = memberships.map((m) => ({
                id: m.society.id,
                name: m.society.name,
                role: m.role,
            }));
        }

        // 3. Get Active Donation Campaigns in the organization
        let activeCampaigns: any[] = [];
        if (orgId) {
            const campaigns = await db.donationCampaign.findMany({
                where: {
                    organizationId: orgId,
                    isActive: true,
                },
                take: 3,
                orderBy: { createdAt: 'desc' },
            });

            activeCampaigns = await Promise.all(campaigns.map(async (c) => {
                const raised = await db.payment.aggregate({
                    where: {
                        donationCampaignId: c.id,
                        paymentStatus: 'COMPLETED',
                    },
                    _sum: { amount: true },
                });
                return {
                    id: c.id,
                    name: c.name,
                    targetAmount: c.targetAmount,
                    raisedAmount: raised._sum.amount || 0,
                };
            }));
        }

        return {
            success: true,
            message: 'Accessible entities retrieved',
            data: {
                organization,
                societies,
                activeCampaigns,
            },
        };
    } catch (error) {
        console.error('Failed to get accessible entities:', error);
        return { success: false, message: 'Failed to retrieve accessible entities' };
    }
}
