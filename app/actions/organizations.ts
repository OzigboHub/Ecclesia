'use server';

import { db as prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser as getUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const organizationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    presidentId: z.string().optional(),
    secretaryId: z.string().optional(),
});

export type OrganizationFormState = {
    errors?: {
        name?: string[];
        description?: string[];
        presidentId?: string[];
        secretaryId?: string[];
        _form?: string[];
    };
    message?: string;
};

export async function getPiousOrganizations(organizationId: string) {
    try {
        const orgs = await prisma.piousOrganization.findMany({
            where: { organizationId },
            include: {
                president: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                secretary: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return orgs;
    } catch (error) {
        console.error('Failed to fetch pious organizations:', error);
        throw new Error('Failed to fetch pious organizations');
    }
}



export type PiousOrganizationWithDetails = Prisma.PiousOrganizationGetPayload<{
    include: {
        president: true,
        secretary: true,
        members: {
            include: {
                parishioner: true
            }
        },
        events: true
    }
}>;

export async function getPiousOrganization(id: string): Promise<PiousOrganizationWithDetails | null> {
    try {
        const org = await prisma.piousOrganization.findUnique({
            where: { id },
            include: {
                president: true,
                secretary: true,
                members: {
                    include: {
                        parishioner: true
                    }
                },
                events: true
            }
        });
        return org;
    } catch (error) {
        console.error('Failed to fetch pious organization:', error);
        throw new Error('Failed to fetch pious organization');
    }
}

export async function createPiousOrganization(
    prevState: OrganizationFormState,
    formData: FormData
): Promise<OrganizationFormState> {
    const user = await getUser();
    if (!user) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = organizationSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        presidentId: formData.get('presidentId') || undefined,
        secretaryId: formData.get('secretaryId') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Organization.',
        };
    }

    const { name, description, presidentId, secretaryId } = validatedFields.data;

    try {
        await prisma.piousOrganization.create({
            data: {
                name,
                description,
                presidentId,
                secretaryId,
                organizationId: user.organizationId,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Organization.',
        };
    }

    revalidatePath('/dashboard/organizations');
    return { message: 'Success' }; // In a real app we might redirect
}

export async function updatePiousOrganization(
    id: string,
    prevState: OrganizationFormState,
    formData: FormData
): Promise<OrganizationFormState> {
    const user = await getUser();
    if (!user) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = organizationSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        presidentId: formData.get('presidentId') || undefined,
        secretaryId: formData.get('secretaryId') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Organization.',
        };
    }

    const { name, description, presidentId, secretaryId } = validatedFields.data;

    try {
        await prisma.piousOrganization.update({
            where: { id },
            data: {
                name,
                description,
                presidentId,
                secretaryId,
            }
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Organization.',
        };
    }

    revalidatePath(`/dashboard/organizations/${id}`);
    revalidatePath('/dashboard/organizations');
    return { message: 'Success' };
}

export async function addMember(organizationId: string, parishionerId: string, role: string) {
    const user = await getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.piousOrganizationMembership.create({
            data: {
                piousOrganizationId: organizationId,
                parishionerId: parishionerId,
                role: role as any, // Using any to bypass strict enum check for now, validate in UI
            },
        });
        revalidatePath(`/dashboard/organizations/${organizationId}`);
    } catch (error) {
        console.error('Failed to add member:', error);
        throw new Error('Failed to add member');
    }
}

export async function removeMember(organizationId: string, parishionerId: string) {
    const user = await getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.piousOrganizationMembership.delete({
            where: {
                parishionerId_piousOrganizationId: {
                    parishionerId: parishionerId,
                    piousOrganizationId: organizationId,
                },
            },
        });
        revalidatePath(`/dashboard/organizations/${organizationId}`);
    } catch (error) {
        console.error('Failed to remove member:', error);
        throw new Error('Failed to remove member');
    }
}

export async function createMeeting(
    organizationId: string,
    piousOrganizationId: string,
    title: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    location?: string
) {
    const user = await getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.event.create({
            data: {
                title,
                startTime,
                endTime,
                description,
                location,
                organizationId,
                piousOrganizationId,
                type: 'MEETING',
                status: 'SCHEDULED',
            },
        });
        revalidatePath(`/dashboard/organizations/${piousOrganizationId}`);
    } catch (error) {
        console.error('Failed to create meeting:', error);
        throw new Error('Failed to create meeting');
    }
}

export async function markAttendance(eventId: string, parishionerId: string, status: string) {
    const user = await getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.eventAttendance.upsert({
            where: {
                eventId_parishionerId: {
                    eventId,
                    parishionerId,
                },
            },
            create: {
                eventId,
                parishionerId,
                status,
            },
            update: {
                status,
            },
        });
        // We might want to revalidate the event detail page here, but for now organization page is fine
        // revalidatePath(`/dashboard/events/${eventId}`); 
    } catch (error) {
        console.error('Failed to mark attendance:', error);
        throw new Error('Failed to mark attendance');
    }
}
