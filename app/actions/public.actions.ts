'use server';

import db from '@/lib/db';
import type { ActionResponse } from '@/types';

/**
 * Get events that have scheduled livestreams.
 * No authentication required.
 */
export async function getPublicLiveStreams(limit = 4): Promise<ActionResponse<any[]>> {
    try {
        const streams = await db.liveStream.findMany({
            where: {
                isLive: true,
            },
            select: {
                id: true,
                title: true,
                description: true,
                streamUrl: true,
                scheduledFor: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { scheduledFor: 'asc' },
            take: limit,
        });

        return {
            success: true,
            message: 'Livestreams retrieved',
            data: streams,
        };
    } catch (error) {
        console.error('Failed to get public livestreams:', error);
        return { success: false, message: 'Failed to retrieve livestreams', data: [] };
    }
}

/**
 * Get upcoming public events across organizations.
 * No authentication required.
 */
export async function getPublicUpcomingEvents(limit = 6): Promise<ActionResponse<any[]>> {
    try {
        const events = await db.event.findMany({
            where: {
                startTime: { gte: new Date() },
                status: { in: ['SCHEDULED'] },
            },
            select: {
                id: true,
                title: true,
                description: true,
                startTime: true,
                endTime: true,
                location: true,
                type: true,
                status: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { startTime: 'asc' },
            take: limit,
        });

        return { success: true, message: 'Events retrieved', data: events };
    } catch (error) {
        console.error('Failed to get public events:', error);
        return { success: false, message: 'Failed to retrieve events', data: [] };
    }
}

/**
 * Get active donation campaigns with progress.
 * No authentication required.
 */
export async function getPublicActiveCampaigns(): Promise<ActionResponse<any[]>> {
    try {
        const campaigns = await db.donationCampaign.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                description: true,
                targetAmount: true,
                startDate: true,
                endDate: true,
                organizationId: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 6,
        });

        const campaignsWithProgress = await Promise.all(
            campaigns.map(async (campaign) => {
                const raised = await db.payment.aggregate({
                    where: {
                        donationCampaignId: campaign.id,
                        paymentStatus: 'COMPLETED',
                    },
                    _sum: { amount: true },
                });

                return {
                    ...campaign,
                    raisedAmount: raised._sum.amount || 0,
                    progress: Math.min(
                        100,
                        ((raised._sum.amount || 0) / campaign.targetAmount) * 100
                    ),
                };
            })
        );

        return {
            success: true,
            message: 'Campaigns retrieved',
            data: campaignsWithProgress,
        };
    } catch (error) {
        console.error('Failed to get public campaigns:', error);
        return { success: false, message: 'Failed to retrieve campaigns', data: [] };
    }
}
