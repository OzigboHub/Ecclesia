import { z } from 'zod';

// ============================================
// COMMON FIELD SCHEMAS (Reusable)
// ============================================

const nameSchema = z
	.string()
	.min(2, 'Name must be at least 2 characters')
	.max(100, 'Name must not exceed 100 characters')
	.trim();

const emailSchema = z
	.string()
	.email('Please enter a valid email address')
	.toLowerCase()
	.trim();

const phoneSchema = z
	.string()
	.regex(
		/^(\+234|0)[789][01]\d{8}$/,
		'Please enter a valid Nigerian phone number (e.g., 08012345678)'
	)
	.optional()
	.or(z.literal(''));

const dateOfBirthSchema = z
	.string()
	.optional()
	.refine(
		(val) => {
			if (!val) return true;
			const date = new Date(val);
			const now = new Date();
			return date < now;
		},
		{ message: 'Date of birth must be in the past' }
	);

// ============================================
// CREATE PARISHIONER SCHEMA
// ============================================

export const createParishionerSchema = z.object({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	phone: phoneSchema,
	dateOfBirth: dateOfBirthSchema,
	gender: z.enum(['MALE', 'FEMALE'], {
		message: 'Please select a gender',
	}),
	maritalStatus: z
		.enum(['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'], {
			message: 'Please select marital status',
		})
		.optional(),
	address: z
		.string()
		.max(500, 'Address must not exceed 500 characters')
		.optional(),
	occupation: z
		.string()
		.max(100, 'Occupation must not exceed 100 characters')
		.optional(),
});

export type CreateParishionerInput = z.infer<typeof createParishionerSchema>;

// ============================================
// UPDATE PARISHIONER SCHEMA (All fields optional)
// ============================================

export const updateParishionerSchema = createParishionerSchema.partial();

export type UpdateParishionerInput = z.infer<typeof updateParishionerSchema>;

// ============================================
// QUERY/FILTER SCHEMA
// ============================================

export const parishionerQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	gender: z.enum(['MALE', 'FEMALE']).optional(),
	maritalStatus: z
		.enum(['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'])
		.optional(),
	sortBy: z.enum(['firstName', 'lastName', 'createdAt']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ParishionerQuery = z.infer<typeof parishionerQuerySchema>;
