import { z } from 'zod';

export const paymentTypeCategoryEnum = z.enum([
	'OFFERING',
	'TITHE',
	'DONATION',
	'OTHER',
]);

export const createPaymentTypeSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters')
		.max(100, 'Name must be at most 100 characters'),
	description: z.string().max(500).optional(),
	category: paymentTypeCategoryEnum,
});

export type CreatePaymentTypeInput = z.infer<typeof createPaymentTypeSchema>;

export const updatePaymentTypeSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	description: z.string().max(500).optional(),
	category: paymentTypeCategoryEnum.optional(),
	isActive: z.boolean().optional(),
});

export type UpdatePaymentTypeInput = z.infer<typeof updatePaymentTypeSchema>;

export const massPaymentTypesSchema = z.object({
	massId: z.string().uuid(),
	paymentTypeIds: z.array(z.string().uuid()),
});

export type MassPaymentTypesInput = z.infer<typeof massPaymentTypesSchema>;
