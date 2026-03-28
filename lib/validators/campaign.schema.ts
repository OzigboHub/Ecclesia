import { z } from 'zod';

export const campaignStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);

const campaignBaseSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(150, 'Name must not exceed 150 characters')
        .trim(),
    description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().or(z.literal('')),
    targetAmount: z.coerce
        .number()
        .positive('Target amount must be greater than 0')
        .max(1_000_000_000, 'Target amount cannot exceed ₦1,000,000,000'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
});

export const createCampaignSchema = campaignBaseSchema.refine((data) => !data.endDate || data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = campaignBaseSchema.partial().extend({
    id: z.string().uuid(),
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const campaignQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    organizationId: z.string().uuid().optional(),
});

export type CampaignQuery = z.infer<typeof campaignQuerySchema>;
