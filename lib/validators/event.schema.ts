import { z } from 'zod';

export const eventStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);
export const eventTypeEnum = z.enum([
    'MEETING',
    'ACTIVITY',
    'FUNDRAISER',
    'OTHER',
]);

const eventBaseSchema = z.object({
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(150, 'Title must not exceed 150 characters')
        .trim(),
    description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().or(z.literal('')),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().max(255, 'Location must not exceed 255 characters').optional().or(z.literal('')),
    type: eventTypeEnum.default('MEETING'),
    status: eventStatusEnum.default('SCHEDULED'),
    maxAttendees: z.coerce.number().int().positive().optional().nullable(),
    streamUrl: z.string().url('Invalid stream URL').optional().or(z.literal('')),
    enablePayments: z.boolean().default(false),
    societyId: z.string().uuid('Invalid society ID').optional().nullable(),
});

export const createEventSchema = eventBaseSchema.refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = eventBaseSchema.partial().extend({
    id: z.string().uuid(),
}).refine((data) => {
    if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
    }
    return true;
}, {
    message: 'End time must be after start time',
    path: ['endTime'],
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const eventQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    type: eventTypeEnum.optional(),
    status: eventStatusEnum.optional(),
    organizationId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});

export type EventQuery = z.infer<typeof eventQuerySchema>;
