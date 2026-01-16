import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import type { Organization } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Plus, Trash2, Users } from 'lucide-react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteOrganizationAdminAction } from '@/app/actions/organization.actions';
import { toast } from 'sonner';
import { revalidatePath } from 'next/cache';
import { TransferOutstationClient } from '@/components/features/organizations/transfer-outstation-client';

interface OrganizationDetailPageProps {
	params: {
		id: string;
	};
}

export default async function OrganizationDetailPage({
	params,
}: OrganizationDetailPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const organization = await db.organization.findUnique({
		where: { id: params.id },
		include: {
			users: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					role: true,
				},
			},
			parishioners: { select: { id: true } },
			children: true,
			parent: true,
		},
	});

	if (!organization) {
		redirect('/dashboard/admin/organizations');
	}

	// Fetch all parishes for transfer modal (outstations only)
	let allParishes: Organization[] = [];
	if (organization.level === 'OUTSTATION') {
		allParishes = await db.organization.findMany({
			where: { level: 'PARISH' },
			orderBy: { name: 'asc' },
		});
	}

	const isParish = organization.level === 'PARISH';
	const userCount = organization.users.length;
	const parishionerCount = organization.parishioners.length;
	const outstationCount = organization.children.length;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-start justify-between'>
				<div className='space-y-2'>
					<Link href='/dashboard/admin/organizations'>
						<Button
							variant='ghost'
							size='sm'
							className='mb-2'
						>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back to Organizations
						</Button>
					</Link>
					<h1 className='text-3xl font-bold tracking-tight'>
						{organization.name}
					</h1>
					<div className='flex items-center gap-2 mt-2'>
						<Badge variant='outline'>
							{organization.level === 'PARISH'
								? '⛪ Parish'
								: '🏛️ Outstation'}
						</Badge>
						{!isParish && organization.parent && (
							<div className='text-sm text-muted-foreground'>
								Parent: {organization.parent.name}
							</div>
						)}
					</div>
				</div>
				<div className='flex gap-2'>
					<Link
						href={`/dashboard/admin/organizations/${params.id}/edit`}
					>
						<Button>
							<Edit className='h-4 w-4 mr-2' />
							Edit
						</Button>
					</Link>
					{!isParish && (
						<TransferOutstationClient
							outstation={organization}
							currentParish={organization.parent}
							availableParishes={allParishes}
						/>
					)}
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant='destructive'>
								<Trash2 className='h-4 w-4 mr-2' />
								Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Delete Organization
								</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. Are you sure
									you want to delete this organization?
									{(userCount > 0 ||
										parishionerCount > 0) && (
										<div className='mt-2 p-2 bg-destructive/10 rounded text-sm'>
											This organization has {userCount}{' '}
											users and {parishionerCount}{' '}
											parishioners. They must be
											reassigned or deleted first.
										</div>
									)}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={async () => {
									const result =
										await deleteOrganizationAdminAction(
											params.id
										);
									if (result.success) {
										toast.success(result.message);
										revalidatePath(
											'/dashboard/admin/organizations'
										);
										redirect(
											'/dashboard/admin/organizations'
										);
									} else {
										toast.error(result.message);
									}
								}}
								className='bg-destructive hover:bg-destructive/90'
							>
								Delete
							</AlertDialogAction>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{/* Info Grid */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{/* Users Card */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Users
						</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{userCount}</div>
					</CardContent>
				</Card>

				{/* Parishioners Card */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Parishioners
						</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{parishionerCount}
						</div>
					</CardContent>
				</Card>

				{/* Outstations Card (if Parish) */}
				{isParish && (
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Outstations
							</CardTitle>
							<Users className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{outstationCount}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Created Date Card */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Created
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-sm font-medium'>
							{organization.createdAt.toLocaleDateString()}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Organization Details */}
			<Card>
				<CardHeader>
					<CardTitle>Organization Details</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{organization.address && (
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Address
							</label>
							<p>{organization.address}</p>
						</div>
					)}
					{organization.contactEmail && (
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Contact Email
							</label>
							<p>
								<a
									href={`mailto:${organization.contactEmail}`}
									className='text-primary hover:underline'
								>
									{organization.contactEmail}
								</a>
							</p>
						</div>
					)}
					{organization.contactPhone && (
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Contact Phone
							</label>
							<p>
								<a
									href={`tel:${organization.contactPhone}`}
									className='text-primary hover:underline'
								>
									{organization.contactPhone}
								</a>
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Users Section */}
			{userCount > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Users in this Organization</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-2'>
							{organization.users.map((user) => (
								<div
									key={user.id}
									className='flex items-center justify-between p-3 rounded-lg border'
								>
									<div>
										<p className='font-medium'>
											{user.firstName} {user.lastName}
										</p>
										<Badge variant='secondary'>
											{user.role}
										</Badge>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Outstations Section (if Parish) */}
			{isParish && outstationCount > 0 && (
				<Card>
					<CardHeader className='flex flex-row items-center justify-between'>
						<CardTitle>Outstations</CardTitle>
						<Link
							href={`/dashboard/admin/organizations/${params.id}/new-outstation`}
						>
							<Button size='sm'>
								<Plus className='h-4 w-4 mr-2' />
								Add Outstation
							</Button>
						</Link>
					</CardHeader>
					<CardContent>
						<div className='grid gap-4 md:grid-cols-2'>
							{organization.children.map((outstation) => (
								<Link
									key={outstation.id}
									href={`/dashboard/admin/organizations/${outstation.id}`}
								>
									<div className='p-4 rounded-lg border hover:bg-accent transition-colors'>
										<p className='font-medium'>
											{outstation.name}
										</p>
										{outstation.address && (
											<p className='text-sm text-muted-foreground'>
												{outstation.address}
											</p>
										)}
									</div>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Create Outstation Button (if Parish and no outstations) */}
			{isParish && outstationCount === 0 && (
				<Card>
					<CardContent className='pt-6'>
						<div className='text-center space-y-4'>
							<p className='text-muted-foreground'>
								No outstations yet
							</p>
							<Link
								href={`/dashboard/admin/organizations/${params.id}/new-outstation`}
							>
								<Button>
									<Plus className='h-4 w-4 mr-2' />
									Create First Outstation
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
