'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
    createCampaignSchema,
    updateCampaignSchema,
    campaignQuerySchema,
    type CampaignQuery,
} from '@/lib/validators/campaign.schema';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import { isFeatureEnabled } from '@/lib/features.server';

export async function getCampaigns(query?: Partial<CampaignQuery>): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        const parsed = campaignQuerySchema.safeParse(query || {});

        if (!parsed.success) {
            return {
                success: false,
                message: 'Invalid query parameters',
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const { page, limit, search, isActive, organizationId } = parsed.data;
        const targetOrgId = organizationId || session?.user?.organizationId;

        if (!targetOrgId) {
            return { success: false, message: 'Organization ID is required' };
        }

        const enabled = await isFeatureEnabled(targetOrgId, 'enableDonationCampaigns');
        if (!enabled) {
            return { success: false, message: 'Donation campaigns are not enabled for this organization' };
        }

        const where: Prisma.DonationCampaignWhereInput = {
            organizationId: targetOrgId,
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [campaigns, total] = await Promise.all([
            db.donationCampaign.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: {
                        select: {
                            payments: {
                                where: { paymentStatus: 'COMPLETED' },
                            },
                        },
                    },
                },
            }),
            db.donationCampaign.count({ where }),
        ]);

        // Calculate amount raised for each campaign
        const campaignsWithProgress = await Promise.all(campaigns.map(async (campaign) => {
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
                progress: (raised._sum.amount || 0) / campaign.targetAmount * 100,
            };
        }));

        return {
            success: true,
            message: 'Campaigns retrieved successfully',
            data: { campaigns: campaignsWithProgress, total },
        };
    } catch (error) {
        console.error('Failed to get campaigns:', error);
        return { success: false, message: 'Failed to retrieve campaigns' };
    }
}

export async function getCampaign(id: string, organizationId?: string): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        const targetOrgId = organizationId || session?.user?.organizationId;

        const campaign = await db.donationCampaign.findFirst({
            where: {
                id,
                ...(targetOrgId && { organizationId: targetOrgId }),
            },
            include: {
                _count: {
                    select: {
                        payments: {
                            where: { paymentStatus: 'COMPLETED' },
                        },
                    },
                },
            },
        });

        if (!campaign) {
            return { success: false, message: 'Campaign not found' };
        }

        const raised = await db.payment.aggregate({
            where: {
                donationCampaignId: campaign.id,
                paymentStatus: 'COMPLETED',
            },
            _sum: { amount: true },
        });

        const campaignWithProgress = {
            ...campaign,
            raisedAmount: raised._sum.amount || 0,
            progress: (raised._sum.amount || 0) / campaign.targetAmount * 100,
        };

        return {
            success: true,
            message: 'Campaign retrieved successfully',
            data: campaignWithProgress,
        };
    } catch (error) {
        console.error('Failed to get campaign:', error);
        return { success: false, message: 'Failed to retrieve campaign' };
    }
}

export async function createCampaign(data: any): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        if (!session) return { success: false, message: 'Unauthorized' };

        const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN', 'PARISH_SECRETARY'];
        if (!allowedRoles.includes(session.user.role)) {
            return { success: false, message: 'Unauthorized: insufficient permissions' };
        }

        const parsed = createCampaignSchema.safeParse(data);
        if (!parsed.success) {
            return {
                success: false,
                message: 'Validation failed',
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const campaign = await db.donationCampaign.create({
            data: {
                ...parsed.data,
                organizationId: session.user.organizationId,
            },
        });

        revalidatePath('/dashboard/campaigns');
        return {
            success: true,
            message: 'Campaign created successfully',
            data: campaign,
        };
    } catch (error) {
        console.error('Failed to create campaign:', error);
        return { success: false, message: 'Failed to create campaign' };
    }
}

export async function updateCampaign(id: string, data: any): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        if (!session) return { success: false, message: 'Unauthorized' };

        const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN', 'PARISH_SECRETARY'];
        if (!allowedRoles.includes(session.user.role)) {
            return { success: false, message: 'Unauthorized: insufficient permissions' };
        }

        const parsed = updateCampaignSchema.safeParse({ ...data, id });
        if (!parsed.success) {
            return {
                success: false,
                message: 'Validation failed',
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const existing = await db.donationCampaign.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });

        if (!existing) {
            return { success: false, message: 'Campaign not found or unauthorized' };
        }

        const campaign = await db.donationCampaign.update({
            where: { id },
            data: parsed.data,
        });

        revalidatePath('/dashboard/campaigns');
        revalidatePath(`/dashboard/campaigns/${id}`);
        return {
            success: true,
            message: 'Campaign updated successfully',
            data: campaign,
        };
    } catch (error) {
        console.error('Failed to update campaign:', error);
        return { success: false, message: 'Failed to update campaign' };
    }
}

export async function deleteCampaign(id: string): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        if (!session) return { success: false, message: 'Unauthorized' };

        const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN'];
        if (!allowedRoles.includes(session.user.role)) {
            return { success: false, message: 'Unauthorized: insufficient permissions' };
        }

        const existing = await db.donationCampaign.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });

        if (!existing) {
            return { success: false, message: 'Campaign not found or unauthorized' };
        }

        // Check if campaign has payments before deleting
        const paymentCount = await db.payment.count({
            where: { donationCampaignId: id },
        });

        if (paymentCount > 0) {
            // Instead of deleting, just deactivate
            await db.donationCampaign.update({
                where: { id },
                data: { isActive: false },
            });
            return {
                success: true,
                message: 'Campaign has payments and cannot be deleted. It has been deactivated instead.',
            };
        }

        await db.donationCampaign.delete({ where: { id } });

        revalidatePath('/dashboard/campaigns');
        return {
            success: true,
            message: 'Campaign deleted successfully',
        };
    } catch (error) {
        console.error('Failed to delete campaign:', error);
        return { success: false, message: 'Failed to delete campaign' };
    }
}
