# Skill: Zod Validation Schemas

## Metadata

-   **ID**: `ecclesia.validation.zod_schemas`
-   **Version**: 1.0.0
-   **Category**: Validation
-   **Priority**: Critical

## Purpose

Always validate inputs in Server Actions using Zod schemas. This ensures type safety, prevents malformed data from reaching the database, and provides clear error messages to users.

## When to Use

-   Creating or updating any data
-   Processing form submissions
-   Validating API inputs
-   Defining reusable validation rules

## Constraints

-   **All validation schemas must be in `lib/validators/` directory**
-   **Export both schema and inferred TypeScript type**
-   **Use descriptive error messages**
-   **Validate at Server Action level, not in components**
-   **Create separate schemas for create vs update operations**

## File Structure

```
lib/validators/
├── parishioner.schema.ts
├── payment.schema.ts
├── mass-intention.schema.ts
├── appointment.schema.ts
├── organization.schema.ts
├── auth.schema.ts
└── common.schema.ts        # Shared/reusable schemas
```

## Schema Definition Pattern

```tsx
// lib/validators/parishioner.schema.ts
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
		'Please enter a valid Nigerian phone number'
	)
	.optional()
	.or(z.literal(''));

const dateOfBirthSchema = z
	.string()
	.refine((val) => {
		const date = new Date(val);
		const now = new Date();
		return date < now;
	}, 'Date of birth must be in the past')
	.transform((val) => new Date(val));

// ============================================
// CREATE SCHEMA
// ============================================

export const createParishionerSchema = z.object({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	phone: phoneSchema,
	dateOfBirth: dateOfBirthSchema.optional(),
	gender: z.enum(['MALE', 'FEMALE'], {
		errorMap: () => ({ message: 'Please select a gender' }),
	}),
	maritalStatus: z
		.enum(['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'], {
			errorMap: () => ({ message: 'Please select marital status' }),
		})
		.optional(),
	address: z.string().max(500).optional(),
	occupation: z.string().max(100).optional(),
});

// Infer TypeScript type from schema
export type CreateParishionerInput = z.infer<typeof createParishionerSchema>;

// ============================================
// UPDATE SCHEMA (All fields optional)
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
```

## Payment Schema Example (with Nigerian Naira)

```tsx
// lib/validators/payment.schema.ts
import { z } from 'zod';

// Nigerian Naira amount validation
const nairaAmountSchema = z
	.number()
	.positive('Amount must be greater than ₦0')
	.max(100_000_000, 'Amount cannot exceed ₦100,000,000')
	.multipleOf(0.01, 'Amount must have at most 2 decimal places');

// Or from string input (form fields)
const nairaAmountFromStringSchema = z
	.string()
	.transform((val) => parseFloat(val.replace(/[₦,]/g, '')))
	.pipe(nairaAmountSchema);

export const createPaymentSchema = z
	.object({
		amount: nairaAmountSchema,
		purpose: z.enum(
			[
				'OFFERING',
				'TITHE',
				'MASS_INTENTION',
				'DONATION_CAMPAIGN',
				'CUSTOM_DONATION',
				'OTHER',
			],
			{
				errorMap: () => ({
					message: 'Please select a payment purpose',
				}),
			}
		),
		method: z.enum(
			['CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_MONEY', 'CHECK'],
			{
				errorMap: () => ({ message: 'Please select a payment method' }),
			}
		),
		parishionerId: z.string().uuid('Invalid parishioner ID').optional(),
		payerName: z.string().min(2).max(100).optional(),
		payerEmail: z.string().email().optional(),
		payerPhone: z.string().optional(),
		notes: z.string().max(1000).optional(),
		offeringMonth: z.number().int().min(1).max(12).optional(),
		campaignId: z.string().uuid().optional(),
		transactionReference: z.string().optional(),
	})
	.refine((data) => data.parishionerId || data.payerName, {
		message: 'Either parishioner or payer name is required',
		path: ['payerName'],
	});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
```

## Auth Schema Example

```tsx
// lib/validators/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().email('Please enter a valid email'),
	password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
	.object({
		firstName: z
			.string()
			.min(2, 'First name must be at least 2 characters'),
		lastName: z.string().min(2, 'Last name must be at least 2 characters'),
		email: z.string().email('Please enter a valid email'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/[A-Z]/,
				'Password must contain at least one uppercase letter'
			)
			.regex(/[0-9]/, 'Password must contain at least one number')
			.regex(
				/[^A-Za-z0-9]/,
				'Password must contain at least one special character'
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z
	.object({
		token: z.string().min(1),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/[A-Z]/,
				'Password must contain at least one uppercase letter'
			)
			.regex(/[0-9]/, 'Password must contain at least one number')
			.regex(
				/[^A-Za-z0-9]/,
				'Password must contain at least one special character'
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

## Common/Shared Schemas

```tsx
// lib/validators/common.schema.ts
import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination
export const paginationSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Date range
export const dateRangeSchema = z
	.object({
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
	})
	.refine((data) => data.startDate <= data.endDate, {
		message: 'Start date must be before end date',
		path: ['endDate'],
	});

// Nigerian phone number
export const nigerianPhoneSchema = z
	.string()
	.regex(
		/^(\+234|0)[789][01]\d{8}$/,
		'Enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)'
	);

// File upload
export const fileUploadSchema = z.object({
	name: z.string(),
	size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
	type: z
		.string()
		.refine(
			(type) =>
				[
					'image/jpeg',
					'image/png',
					'image/webp',
					'application/pdf',
				].includes(type),
			'Only JPEG, PNG, WebP images and PDFs are allowed'
		),
});
```

## Using Schemas in Server Actions

```tsx
// app/actions/parishioner.actions.ts
'use server';

import { createParishionerSchema } from '@/lib/validators/parishioner.schema';
import type { ActionResponse } from '@/types';

export async function createParishioner(
	formData: unknown
): Promise<ActionResponse> {
	// ... auth checks ...

	// Validate with Zod
	const parsed = createParishionerSchema.safeParse(formData);

	if (!parsed.success) {
		return {
			success: false,
			message: 'Please check your input and try again',
			errors: parsed.error.flatten().fieldErrors,
		};
	}

	// parsed.data is now fully typed and validated
	const { firstName, lastName, email, ...rest } = parsed.data;

	// ... create in database ...
}
```

## Using Schemas with React Hook Form

```tsx
// components/forms/parishioner-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createParishionerSchema,
	type CreateParishionerInput,
} from '@/lib/validators/parishioner.schema';

export function ParishionerForm() {
	const form = useForm<CreateParishionerInput>({
		resolver: zodResolver(createParishionerSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			gender: undefined,
		},
	});

	// form.formState.errors will have properly typed error messages
	// form.handleSubmit will only call onSubmit if validation passes
}
```

## Advanced Patterns

### Conditional Validation

```tsx
const massIntentionSchema = z
	.object({
		type: z.enum(['THANKSGIVING', 'REQUIEM', 'SPECIAL']),
		deceasedName: z.string().optional(),
	})
	.refine((data) => data.type !== 'REQUIEM' || data.deceasedName, {
		message: 'Deceased name is required for Requiem mass',
		path: ['deceasedName'],
	});
```

### Transform Data

```tsx
const schema = z.object({
	email: z.string().email().toLowerCase().trim(),
	amount: z.string().transform((val) => parseFloat(val)),
	date: z.string().transform((val) => new Date(val)),
});
```

### Async Validation

```tsx
const uniqueEmailSchema = z
	.string()
	.email()
	.refine(
		async (email) => {
			const existing = await db.user.findUnique({ where: { email } });
			return !existing;
		},
		{ message: 'This email is already registered' }
	);
```

## Testing Checklist

-   [ ] Schema is in `lib/validators/` directory
-   [ ] Both schema and type are exported
-   [ ] Error messages are user-friendly
-   [ ] Required vs optional fields are correct
-   [ ] Transformations are applied where needed
-   [ ] Cross-field validations use `.refine()`
-   [ ] Schema is used in Server Action with `.safeParse()`

## Related Skills

-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.forms.react_hook_form`
-   `ecclesia.ui.form_error_display`

## References

-   [Zod Documentation](https://zod.dev)
-   [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
