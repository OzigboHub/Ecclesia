'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
    createEventSchema,
    updateEventSchema,
    eventQuerySchema,
    type EventQuery,
} from '@/lib/validators/event.schema';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import { isFeatureEnabled } from '@/lib/features.server';

/**
 * Get events with public access support.
 * If organizationId is provided, returns public events for that organization.
 * If no organizationId, returns events for the logged-in user's organization.
 */
export async function getEvents(query?: Partial<EventQuery>): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        const parsed = eventQuerySchema.safeParse(query || {});

        if (!parsed.success) {
            return {
                success: false,
                message: 'Invalid query parameters',
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const { page, limit, search, type, status, organizationId, from, to } = parsed.data;

        // Determine which organization to filter by
        const targetOrgId = organizationId || session?.user?.organizationId;

        if (!targetOrgId) {
            return { success: false, message: 'Organization ID is required' };
        }

        // Check if feature is enabled for the organization
        const enabled = await isFeatureEnabled(targetOrgId, 'enableEventManagement');
        if (!enabled) {
            return { success: false, message: 'Event management is not enabled for this organization' };
        }

        const where: Prisma.EventWhereInput = {
            organizationId: targetOrgId,
            ...(type && { type }),
            ...(status && { status }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(from && { startTime: { gte: from } }),
            ...(to && { startTime: { lte: to } }),
        };

        const [events, total] = await Promise.all([
            db.event.findMany({
                where,
                orderBy: { startTime: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    society: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            db.event.count({ where }),
        ]);

        return {
            success: true,
            message: 'Events retrieved successfully',
            data: { events, total },
        };
    } catch (error) {
        console.error('Failed to get events:', error);
        return { success: false, message: 'Failed to retrieve events' };
    }
}

export async function getEvent(id: string, organizationId?: string): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        const targetOrgId = organizationId || session?.user?.organizationId;

        const event = await db.event.findFirst({
            where: {
                id,
                ...(targetOrgId && { organizationId: targetOrgId }),
            },
            include: {
                society: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: {
                        attendance: true,
                        massIntentions: true,
                    },
                },
            },
        });

        if (!event) {
            return { success: false, message: 'Event not found' };
        }

        return {
            success: true,
            message: 'Event retrieved successfully',
            data: event,
        };
    } catch (error) {
        console.error('Failed to get event:', error);
        return { success: false, message: 'Failed to retrieve event' };
    }
}

export async function createEvent(data: any): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        if (!session) return { success: false, message: 'Unauthorized' };

        // Basic role check
        const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN', 'PARISH_SECRETARY'];
        if (!allowedRoles.includes(session.user.role)) {
            return { success: false, message: 'Unauthorized: insufficient permissions' };
        }

        const parsed = createEventSchema.safeParse(data);
        if (!parsed.success) {
            return {
                success: false,
                message: 'Validation failed',
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const event = await db.event.create({
            data: {
                ...parsed.data,
                organizationId: session.user.organizationId,
            },
        });

        revalidatePath('/dashboard/events');
        return {
            success: true,
            message: 'Event created successfully',
            data: event,
        };
    } catch (error) {
        console.error('Failed to create event:', error);
        return { success: false, message: 'Failed to create event' };
    }
}

export async function updateEvent(id: string, data: any): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        if (!session) return { success: false, message: 'Unauthorized' };

        const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN', 'PARISH_SECRETARY'];
        if (!allowedRoles.includes(session.user.role)) {
            return { success: false, message: 'Unauthorized: insufficient permissions' };
        }

        const parsed = updateEventSchema.safeParse({ ...data, id });
        if (!parsed.success) {
            return {
                success: false,
                message: 'Validation failed',
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const existing = await db.event.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });

        if (!existing) {
            return { success: false, message: 'Event not found or unauthorized' };
        }

        const event = await db.event.update({
            where: { id },
            data: parsed.data,
        });

        revalidatePath('/dashboard/events');
        revalidatePath(`/dashboard/events/${id}`);
        return {
            success: true,
            message: 'Event updated successfully',
            data: event,
        };
    } catch (error) {
        console.error('Failed to update event:', error);
        return { success: false, message: 'Failed to update event' };
    }
}

export async function deleteEvent(id: string): Promise<ActionResponse<any>> {
    try {
        const session = await auth();
        if (!session) return { success: false, message: 'Unauthorized' };

        const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN'];
        if (!allowedRoles.includes(session.user.role)) {
            return { success: false, message: 'Unauthorized: insufficient permissions' };
        }

        const existing = await db.event.findFirst({
            where: { id, organizationId: session.user.organizationId },
        });

        if (!existing) {
            return { success: false, message: 'Event not found or unauthorized' };
        }

        await db.event.delete({ where: { id } });

        revalidatePath('/dashboard/events');
        return {
            success: true,
            message: 'Event deleted successfully',
        };
    } catch (error) {
        console.error('Failed to delete event:', error);
        return { success: false, message: 'Failed to delete event' };
    }
}
