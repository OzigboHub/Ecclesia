import { createPiousOrganization } from '@/app/actions/organizations';
import { OrganizationForm } from '@/components/forms/organization-form';
import { getCurrentUser as getUser } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export default async function NewOrganizationPage() {
    const user = await getUser();
    if (!user) {
        return <div>Unauthorized</div>;
    }

    // Fetch users for leadership selection
    const users = await prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: 'asc' },
    });

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
                <p className="text-muted-foreground">
                    Register a new pious organization or society.
                </p>
            </div>

            <OrganizationForm action={createPiousOrganization} users={users} />
        </div>
    );
}
