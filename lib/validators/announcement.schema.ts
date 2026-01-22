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
		targetLevels: z
			.array(hierarchyLevelEnum)
			.min(1, 'Select at least one audience'),
		publishAt: optionalDate,
		expiresAt: optionalDate,
	})
	.refine(
		(data) => {
			if (data.publishAt && data.expiresAt) {
				return data.expiresAt > data.publishAt;
			}
			return true;
		},
		{
			message: 'Expiry date must be after publish date',
			path: ['expiresAt'],
		}
	)
	.refine(
		(data) => {
			if (!data.expiresAt) {
				return true;
			}
			const now = new Date();
			return data.expiresAt > now;
		},
		{
			message: 'Expiry date must be in the future',
			path: ['expiresAt'],
		}
	);

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
		targetLevels: z.array(hierarchyLevelEnum).min(1).optional(),
		publishAt: optionalDate,
		expiresAt: nullableDate.optional(),
		isPublished: z.boolean().optional(),
	})
	.refine(
		(data) => {
			if (data.publishAt && data.expiresAt) {
				return data.expiresAt > data.publishAt;
			}
			return true;
		},
		{
			message: 'Expiry date must be after publish date',
			path: ['expiresAt'],
		}
	);

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const announcementFilterSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(200).default(20),
	search: z.string().optional(),
	status: z.enum(['draft', 'scheduled', 'active', 'expired']).optional(),
});

export type AnnouncementFilter = z.infer<typeof announcementFilterSchema>;
