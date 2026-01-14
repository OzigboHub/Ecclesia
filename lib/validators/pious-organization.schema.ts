import { z } from 'zod';

// ============================================
// CREATE SCHEMA
// ============================================

export const createPiousOrganizationSchema = z.object({
	name: z
		.string()
		.min(3, 'Organization name must be at least 3 characters')
		.max(100, 'Organization name must not exceed 100 characters')
		.trim(),
	description: z
		.string()
		.max(500, 'Description must not exceed 500 characters')
		.optional(),
	presidentName: z
		.string()
		.max(100, 'President name must not exceed 100 characters')
		.optional(),
	secretaryName: z
		.string()
		.max(100, 'Secretary name must not exceed 100 characters')
		.optional(),
});

export type CreatePiousOrganizationInput = z.infer<
	typeof createPiousOrganizationSchema
>;

// ============================================
// UPDATE SCHEMA
// ============================================

export const updatePiousOrganizationSchema =
	createPiousOrganizationSchema.partial();

export type UpdatePiousOrganizationInput = z.infer<
	typeof updatePiousOrganizationSchema
>;
