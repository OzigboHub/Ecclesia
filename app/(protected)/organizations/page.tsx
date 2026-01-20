import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPiousOrganizations, PiousOrganizationWithRelations } from '@/app/actions/pious-organization.actions';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Empty,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
} from '@/components/ui/empty';

export default async function OrganizationsPage() {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	const result = await getPiousOrganizations();

	if (!result.success) {
		return (
			<div className='text-center py-10'>
				<p className='text-destructive'>{result.message}</p>
			</div>
		);
	}

	const organizations: PiousOrganizationWithRelations[] = result.data ?? [];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>
						Pious Organizations
					</h1>
					<p className='text-muted-foreground'>
						Manage church societies, groups, and pious
						organizations.
					</p>
				</div>
				<Button asChild>
					<Link href='/dashboard/organizations/new'>
						<PlusCircle className='mr-2 h-4 w-4' />
						New Organization
					</Link>
				</Button>
			</div>

			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{organizations.length === 0 ? (
					<div className='col-span-full'>
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No organizations found</EmptyTitle>
								<EmptyDescription>
									Create your first pious organization to get
									started.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
				) : (
					organizations.map((org: PiousOrganizationWithRelations) => (
						<Card
							key={org.id}
							className='hover:shadow-md transition-shadow'
						>
							<CardHeader>
								<div className='flex justify-between items-start'>
									<CardTitle className='text-xl'>
										<Link
											href={`/dashboard/organizations/${org.id}`}
											className='hover:underline'
										>
											{org.name}
										</Link>
									</CardTitle>
								</div>
								{org.description && (
									<CardDescription className='line-clamp-2'>
										{org.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className='space-y-3 text-sm'>
									<div className='flex items-center text-muted-foreground'>
										<Users className='mr-2 h-4 w-4' />
										<span>
											{org._count.members} Members
										</span>
									</div>

									{org.president && (
										<div className='pt-2 border-t'>
											<span className='font-medium'>
												President:
											</span>{' '}
											{org.president.firstName}{' '}
											{org.president.lastName}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
