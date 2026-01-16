import { z } from 'zod';

// ============================================
// COMMON FIELD SCHEMAS
// ============================================

const organizationNameSchema = z
	.string()
	.min(2, 'Organization name must be at least 2 characters')
	.max(150, 'Organization name must not exceed 150 characters')
	.trim();

const contactEmailSchema = z
	.string()
	.email('Please enter a valid email address')
	.toLowerCase()
	.trim()
	.optional()
	.or(z.literal(''));

const contactPhoneSchema = z
	.string()
	.regex(
		/^(\+234|0)[789][01]\d{8}$/,
		'Please enter a valid Nigerian phone number'
	)
	.optional()
	.or(z.literal(''));

const addressSchema = z
	.string()
	.max(500, 'Address must not exceed 500 characters')
	.optional()
	.or(z.literal(''));

// ============================================
// CREATE PARISH SCHEMA
// ============================================

export const createParishSchema = z.object({
	name: organizationNameSchema,
	address: addressSchema,
	contactEmail: contactEmailSchema,
	contactPhone: contactPhoneSchema,
});

export type CreateParishInput = z.infer<typeof createParishSchema>;

// ============================================
// CREATE OUTSTATION SCHEMA
// ============================================

export const createOutstationSchema = z
	.object({
		name: organizationNameSchema,
		parentId: z
			.string()
			.uuid('Invalid parish ID')
			.min(1, 'Parish is required'),
		address: addressSchema,
		contactEmail: contactEmailSchema,
		contactPhone: contactPhoneSchema,
	})
	.refine((data) => data.parentId, {
		message: 'Parent parish must be selected',
		path: ['parentId'],
	});

export type CreateOutstationInput = z.infer<typeof createOutstationSchema>;

// ============================================
// UPDATE ORGANIZATION SCHEMA (Super Admin)
// ============================================

export const updateOrganizationSchema = z
	.object({
		name: organizationNameSchema.optional(),
		address: addressSchema,
		contactEmail: contactEmailSchema,
		contactPhone: contactPhoneSchema,
	})
	.refine((data) => Object.values(data).some((v) => v !== undefined), {
		message: 'At least one field must be updated',
	});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

// ============================================
// TRANSFER OUTSTATION SCHEMA
// ============================================

export const transferOutstationSchema = z
	.object({
		outstationId: z
			.string()
			.uuid('Invalid outstation ID')
			.min(1, 'Outstation ID is required'),
		newParentId: z
			.string()
			.uuid('Invalid parish ID')
			.min(1, 'New parish is required'),
	})
	.refine((data) => data.outstationId !== data.newParentId, {
		message: 'Outstation cannot be moved to itself',
		path: ['newParentId'],
	});

export type TransferOutstationInput = z.infer<typeof transferOutstationSchema>;

// ============================================
// QUERY/FILTER SCHEMAS
// ============================================

export const organizationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	level: z.enum(['PARISH', 'OUTSTATION']).optional(),
	search: z.string().optional(),
	sortBy: z.enum(['name', 'createdAt', 'level']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrganizationQuery = z.infer<typeof organizationQuerySchema>;

// ============================================
// ORGANIZATION DETAILS SCHEMA
// ============================================

export const organizationDetailsSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	level: z.enum(['PARISH', 'OUTSTATION']),
	parentId: z.string().uuid().nullable(),
	address: z.string().nullable(),
	contactEmail: z.string().nullable(),
	contactPhone: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type OrganizationDetails = z.infer<typeof organizationDetailsSchema>;
