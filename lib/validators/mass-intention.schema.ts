import { z } from 'zod';

// Intention type enum (must match Prisma schema)
export const intentionTypeEnum = z.enum([
	'THANKSGIVING',
	'REQUIEM',
	'SPECIAL_INTENTION',
]);

export type IntentionType = z.infer<typeof intentionTypeEnum>;

// ============================================
// CREATE MASS INTENTION SCHEMA
// ============================================

export const createMassIntentionSchema = z.object({
	intention: z
		.string()
		.min(5, 'Intention must be at least 5 characters')
		.max(1000, 'Intention must not exceed 1000 characters'),
	intentionType: intentionTypeEnum,
	requestedBy: z
		.string()
		.min(2, 'Name must be at least 2 characters')
		.max(100, 'Name must not exceed 100 characters'),
	contactEmail: z
		.string()
		.email('Invalid email address')
		.optional()
		.or(z.literal('')),
	contactPhone: z
		.string()
		.regex(
			/^(\+234|0)[789][01]\d{8}$/,
			'Enter a valid Nigerian phone number'
		)
		.optional()
		.or(z.literal('')),
	massDate: z.string().min(1, 'Mass date is required'),
	stipend: z
		.number()
		.positive('Stipend must be positive')
		.max(1000000, 'Stipend cannot exceed ₦1,000,000')
		.optional(),
	parishionerId: z
		.string()
		.uuid('Invalid parishioner selected')
		.optional()
		.or(z.literal('')),
	notes: z
		.string()
		.max(500, 'Notes must not exceed 500 characters')
		.optional(),
});

export type CreateMassIntentionInput = z.infer<
	typeof createMassIntentionSchema
>;

// ============================================
// UPDATE MASS INTENTION SCHEMA
// ============================================

export const updateMassIntentionSchema = createMassIntentionSchema.partial();

export type UpdateMassIntentionInput = z.infer<
	typeof updateMassIntentionSchema
>;

// ============================================
// FILTER/QUERY SCHEMA
// ============================================

export const massIntentionFilterSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	intentionType: intentionTypeEnum.optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	sortBy: z
		.enum(['massDate', 'requestedBy', 'createdAt'])
		.default('massDate'),
	sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type MassIntentionFilter = z.infer<typeof massIntentionFilterSchema>;
