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
	photoUrl: z
		.string()
		.url('Please enter a valid URL')
		.optional()
		.or(z.literal('')),
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
// CSV IMPORT SCHEMA
// ============================================

export const csvParishionerSchema = z.object({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema.optional(),
	phone: phoneSchema,
	dateOfBirth: dateOfBirthSchema,
	gender: z
		.enum(['MALE', 'FEMALE', 'Male', 'Female', 'male', 'female'], {
			message: 'Gender must be MALE or FEMALE',
		})
		.transform((val) => val.toUpperCase() as 'MALE' | 'FEMALE'),
	maritalStatus: z
		.enum(
			[
				'SINGLE',
				'MARRIED',
				'WIDOWED',
				'DIVORCED',
				'Single',
				'Married',
				'Widowed',
				'Divorced',
				'single',
				'married',
				'widowed',
				'divorced',
			],
			{
				message: 'Invalid marital status',
			}
		)
		.transform(
			(val) =>
				val.toUpperCase() as
					| 'SINGLE'
					| 'MARRIED'
					| 'WIDOWED'
					| 'DIVORCED'
		)
		.optional(),
	address: z.string().max(500).optional(),
	occupation: z.string().max(100).optional(),
});

export type CsvParishionerInput = z.infer<typeof csvParishionerSchema>;

export const csvImportResultSchema = z.object({
	total: z.number(),
	successful: z.number(),
	failed: z.number(),
	errors: z.array(
		z.object({
			row: z.number(),
			email: z.string().optional(),
			error: z.string(),
		})
	),
});

export type CsvImportResult = z.infer<typeof csvImportResultSchema>;

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
