import { notFound } from 'next/navigation';
import { updatePiousOrganization, getPiousOrganization } from '@/app/actions/organizations';
import { OrganizationForm } from '@/components/forms/organization-form';
import { getCurrentUser as getUser } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export default async function EditOrganizationPage({ params }: { params: { id: string } }) {
    const user = await getUser();
    if (!user) {
        return <div>Unauthorized</div>;
    }

    const organization = await getPiousOrganization(params.id);

    if (!organization) {
        notFound();
    }

    // Fetch users for leadership selection
    const users = await prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: 'asc' },
    });

    const updateAction = updatePiousOrganization.bind(null, organization.id);

    // Transform to match initialData format (handle potentially null fields explicitly if needed, but the type allows nulls)
    const initialData = {
        name: organization.name,
        description: organization.description,

        presidentId: organization.presidentId,
        secretaryId: organization.secretaryId,
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
                <p className="text-muted-foreground">
                    Update organization details and leadership.
                </p>
            </div>

            <OrganizationForm action={updateAction} initialData={initialData} users={users} />
        </div>
    );
}
