import { z } from 'zod';

// Appointment type enum (must match Prisma schema)
export const appointmentTypeEnum = z.enum([
	'CONFESSION',
	'COUNSELING',
	'MEETING',
	'OTHER',
]);

// Appointment status enum
const appointmentStatusEnum = z.enum([
	'PENDING',
	'CONFIRMED',
	'CANCELLED',
	'COMPLETED',
]);

// Nigerian phone validation
const phoneSchema = z
	.string()
	.regex(
		/^(\+234|0)[789][01]\d{8}$/,
		'Enter a valid Nigerian phone number (e.g., 08012345678)'
	)
	.optional()
	.or(z.literal(''));

// ============================================
// CREATE APPOINTMENT SCHEMA
// ============================================

export const createAppointmentSchema = z
	.object({
		title: z
			.string()
			.min(3, 'Title must be at least 3 characters')
			.max(100, 'Title must not exceed 100 characters')
			.trim(),
		description: z
			.string()
			.max(500, 'Description must not exceed 500 characters')
			.optional(),
		type: appointmentTypeEnum,
		startTime: z.string().min(1, 'Start time is required'),
		endTime: z.string().min(1, 'End time is required'),
		assignedToId: z
			.string()
			.uuid('Invalid staff member selected')
			.optional(),
		parishionerId: z
			.string()
			.min(1, 'Please select a parishioner')
			.uuid('Invalid parishioner selected'),
		notes: z
			.string()
			.max(1000, 'Notes must not exceed 1000 characters')
			.optional(),
	})
	.refine(
		(data) => {
			const start = new Date(data.startTime);
			const end = new Date(data.endTime);
			return end > start;
		},
		{
			message: 'End time must be after start time',
			path: ['endTime'],
		}
	);

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// ============================================
// UPDATE APPOINTMENT SCHEMA
// ============================================

export const updateAppointmentSchema = createAppointmentSchema
	.partial()
	.extend({
		status: appointmentStatusEnum.optional(),
	})
	.refine(
		(data) => {
			if (data.startTime && data.endTime) {
				const start = new Date(data.startTime);
				const end = new Date(data.endTime);
				return end > start;
			}
			return true;
		},
		{
			message: 'End time must be after start time',
			path: ['endTime'],
		}
	);

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ============================================
// APPOINTMENT FILTER SCHEMA
// ============================================

export const appointmentFilterSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	type: appointmentTypeEnum.optional(),
	status: appointmentStatusEnum.optional(),
	assignedToId: z.string().uuid().optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	sortBy: z.enum(['startTime', 'createdAt', 'title']).default('startTime'),
	sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type AppointmentFilter = z.infer<typeof appointmentFilterSchema>;
