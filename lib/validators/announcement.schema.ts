import { z } from 'zod';

export const hierarchyLevelEnum = z.enum(['PARISH', 'OUTSTATION']);

const optionalDate = z.coerce.date().optional();
const nullableDate = z.coerce.date().nullable();

export const createAnnouncementSchema = z
	.object({
		title: z
			.string()
			.min(3, 'Title must be at least 3 characters')
			.max(150, 'Title must not exceed 150 characters')
			.trim(),
		content: z
			.string()
			.min(10, 'Content must be at least 10 characters')
			.max(4000, 'Content must not exceed 4000 characters')
			.trim(),
		publishAt: optionalDate,
	});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z
	.object({
		title: z
			.string()
			.min(3, 'Title must be at least 3 characters')
			.max(150, 'Title must not exceed 150 characters')
			.trim()
			.optional(),
		content: z
			.string()
			.min(10, 'Content must be at least 10 characters')
			.max(4000, 'Content must not exceed 4000 characters')
			.trim()
			.optional(),
		// targetLevels removed: feature guarded at runtime until DB schema matches
		publishAt: optionalDate,
		isPublished: z.boolean().optional(),
	});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const announcementFilterSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(200).default(20),
	search: z.string().optional(),
	status: z.enum(['draft', 'scheduled', 'active']).optional(),
});

export type AnnouncementFilter = z.infer<typeof announcementFilterSchema>;
