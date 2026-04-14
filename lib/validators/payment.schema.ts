import { z } from 'zod';

// Nigerian Naira amount validation
const nairaAmountSchema = z
	.number()
	.positive('Amount must be greater than ₦0')
	.max(100_000_000, 'Amount cannot exceed ₦100,000,000')
	.multipleOf(0.01, 'Amount must have at most 2 decimal places');

// ============================================
// CREATE SCHEMA
// ============================================

export const createPaymentSchema = z
	.object({
		amount: nairaAmountSchema,
		purpose: z.enum([
			'OFFERING',
			'TITHE',
			'MASS_INTENTION',
			'DONATION_CAMPAIGN',
			'CUSTOM_DONATION',
			'SOCIETY_DUES',
			'EVENT_PAYMENT',
			'OTHER',
		]),
		month: z.number().int().min(1).max(12).optional(),
		paymentDate: z.string().optional(),
		paymentMethod: z.enum([
			'CASH',
			'BANK_TRANSFER',
			'CARD',
			'MOBILE_MONEY',
			'CHECK',
		]),
		parishionerId: z.string().uuid('Invalid parishioner ID').optional(),
		payerName: z.string().min(2).max(100).optional(),
		onBehalfOf: z.string().max(100).optional(),
		payerEmail: z.string().email().optional().or(z.literal('')),
		payerPhone: z
			.string()
			.regex(/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone')
			.optional()
			.or(z.literal('')),
		massIntentionId: z.string().uuid().optional(),
		donationCampaignId: z.string().uuid().optional(),
		eventId: z.string().uuid().optional(),
		paymentGateway: z.string().optional(),
		description: z
			.string()
			.max(200, 'Description must not exceed 200 characters')
			.optional(),
		notes: z
			.string()
			.max(1000, 'Notes must not exceed 1000 characters')
			.optional(),
	})
	.refine((data) => data.purpose !== 'OFFERING' || data.paymentDate, {
		message: 'Payment date is required for offerings',
		path: ['paymentDate'],
	})
	.refine(
		(data) => data.purpose !== 'MASS_INTENTION' || data.massIntentionId,
		{
			message: 'Mass intention is required for mass intention payments',
			path: ['massIntentionId'],
		}
	)
	.refine(
		(data) =>
			data.purpose !== 'DONATION_CAMPAIGN' || data.donationCampaignId,
		{
			message: 'Donation campaign is required for campaign donations',
			path: ['donationCampaignId'],
		}
	)
	.refine(
		(data) =>
			data.purpose !== 'EVENT_PAYMENT' || data.eventId,
		{
			message: 'Event is required for event payments',
			path: ['eventId'],
		}
	);

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ============================================
// UPDATE SCHEMA (for pending payments only)
// ============================================

export const updatePaymentSchema = z.object({
	amount: nairaAmountSchema.optional(),
	paymentMethod: z
		.enum(['BANK_TRANSFER', 'CARD', 'MOBILE_MONEY', 'CHECK'])
		.optional(),
	payerName: z.string().min(2).max(100).optional(),
	onBehalfOf: z.string().max(100).optional(),
	payerEmail: z.string().email().optional(),
	payerPhone: z
		.string()
		.regex(/^(\+234|0)[789][01]\d{8}$/)
		.optional(),
	notes: z.string().max(1000).optional(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// ============================================
// QUERY/FILTER SCHEMA
// ============================================

export const paymentQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
		purpose: z
		.enum([
			'OFFERING',
			'TITHE',
			'MASS_INTENTION',
			'DONATION_CAMPAIGN',
			'CUSTOM_DONATION',
			'SOCIETY_DUES',
			'EVENT_PAYMENT',
			'OTHER',
		])
		.optional(),
	status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
	method: z
		.enum(['BANK_TRANSFER', 'CARD', 'MOBILE_MONEY', 'CHECK', 'CASH'])
		.optional(),
	parishionerId: z.string().uuid().optional(),
	month: z.coerce.number().int().min(1).max(12).optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	sortBy: z
		.enum(['amount', 'paymentDate', 'createdAt', 'payerName'])
		.default('paymentDate'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaymentQuery = z.infer<typeof paymentQuerySchema>;

// ============================================
// PAYSTACK INITIALIZATION SCHEMA
// ============================================

export const paystackInitializeSchema = z.object({
	amount: nairaAmountSchema,
	email: z.string().email('Valid email is required for online payment'),
	purpose: z.enum([
		'OFFERING',
		'TITHE',
		'MASS_INTENTION',
		'DONATION_CAMPAIGN',
		'CUSTOM_DONATION',
		'SOCIETY_DUES',
		'EVENT_PAYMENT',
		'OTHER',
	]),
	parishionerId: z.string().uuid().optional(),
	payerName: z.string().min(2).max(100),
	month: z.number().int().min(1).max(12).optional(),
	massIntentionId: z.string().uuid().optional(),
	donationCampaignId: z.string().uuid().optional(),
	eventId: z.string().uuid().optional(),
	paymentTypeId: z.string().uuid().optional(),
});

export type PaystackInitializeInput = z.infer<typeof paystackInitializeSchema>;
