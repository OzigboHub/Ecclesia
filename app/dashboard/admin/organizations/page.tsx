// app/dashboard/admin/organizations/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import {
	getAllOrganizations,
	getSystemMetrics,
} from '@/app/actions/organization.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, AlertCircle, Building, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default async function AdminOrganizationsPage() {
	const session = await auth();

	// Verify super admin access
	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	// Get all organizations and system metrics
	const [orgsResult, metricsResult] = await Promise.all([
		getAllOrganizations(),
		getSystemMetrics(),
	]);

	if (!orgsResult.success) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<Card className='w-full max-w-md'>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-3'>
							<AlertCircle className='h-5 w-5 text-destructive' />
							<p className='text-sm'>{orgsResult.message}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const organizations = orgsResult.data || [];
	const metrics = metricsResult.success ? metricsResult.data : null;

	// Separate parishes and outstations
	const parishes = organizations.filter((org) => org.level === 'PARISH');
	const outstations = organizations.filter(
		(org) => org.level === 'OUTSTATION'
	);

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>
						Organization Management
					</h1>
					<p className='text-muted-foreground mt-1'>
						Manage all parishes and outstations across the platform
					</p>
				</div>
				<Button
					asChild
					className='w-full sm:w-auto'
				>
					<Link href='/dashboard/admin/organizations/new'>
						<Plus className='mr-2 h-4 w-4' />
						Create Parish
					</Link>
				</Button>
			</div>

			{/* Metrics Cards */}
			{metrics && (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Total Parishes
							</CardTitle>
							<Building className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{metrics.totalParishes}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Total Outstations
							</CardTitle>
							<MapPin className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{metrics.totalOutstations}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Total Users
							</CardTitle>
							<Building2 className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{metrics.totalUsers}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Total Parishioners
							</CardTitle>
							<Building2 className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{metrics.totalParishioners}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Parishes Section */}
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<h2 className='text-xl font-bold'>
						Parishes ({parishes.length})
					</h2>
					<Button
						asChild
						size='sm'
					>
						<Link href='/dashboard/admin/organizations/new'>
							<Plus className='mr-2 h-4 w-4' />
							New Parish
						</Link>
					</Button>
				</div>

				{parishes.length === 0 ? (
					<Card>
						<CardContent className='pt-6'>
							<p className='text-sm text-muted-foreground text-center py-8'>
								No parishes created yet. Create your first
								parish to get started.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{parishes.map((parish) => (
							<Card
								key={parish.id}
								className='hover:shadow-md transition-shadow'
							>
								<CardHeader className='pb-3'>
									<div className='flex items-start justify-between'>
										<div>
											<CardTitle className='text-base'>
												{parish.name}
											</CardTitle>
											<Badge
												variant='secondary'
												className='mt-2'
											>
												Parish
											</Badge>
										</div>
										<Building className='h-5 w-5 text-muted-foreground' />
									</div>
								</CardHeader>
								<CardContent className='space-y-3 text-sm'>
									{parish.address && (
										<div>
											<p className='text-muted-foreground'>
												{parish.address}
											</p>
										</div>
									)}
									<div className='flex items-center gap-2 text-muted-foreground'>
										<span className='text-xs'>
											{parish.userCount}{' '}
											{parish.userCount === 1
												? 'user'
												: 'users'}
										</span>
									</div>
									<div className='text-xs text-muted-foreground'>
										Created{' '}
										{new Date(
											parish.createdAt
										).toLocaleDateString()}
									</div>
									<Button
										asChild
										variant='outline'
										size='sm'
										className='w-full'
									>
										<Link
											href={`/dashboard/admin/organizations/${parish.id}`}
										>
											Manage
										</Link>
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Outstations Section */}
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<h2 className='text-xl font-bold'>
						Outstations ({outstations.length})
					</h2>
				</div>

				{outstations.length === 0 ? (
					<Card>
						<CardContent className='pt-6'>
							<p className='text-sm text-muted-foreground text-center py-8'>
								No outstations created yet. Create an outstation
								under a parish.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{outstations.map((outstation) => {
							const parentParish = organizations.find(
								(org) => org.id === outstation.parentId
							);
							return (
								<Card
									key={outstation.id}
									className='hover:shadow-md transition-shadow'
								>
									<CardHeader className='pb-3'>
										<div className='flex items-start justify-between'>
											<div>
												<CardTitle className='text-base'>
													{outstation.name}
												</CardTitle>
												<Badge
													variant='outline'
													className='mt-2'
												>
													Outstation
												</Badge>
											</div>
											<MapPin className='h-5 w-5 text-muted-foreground' />
										</div>
									</CardHeader>
									<CardContent className='space-y-3 text-sm'>
										{parentParish && (
											<div className='flex items-center gap-2'>
												<Building className='h-4 w-4 text-muted-foreground' />
												<p className='text-muted-foreground'>
													Under{' '}
													<span className='font-medium'>
														{parentParish.name}
													</span>
												</p>
											</div>
										)}
										{outstation.address && (
											<div>
												<p className='text-muted-foreground'>
													{outstation.address}
												</p>
											</div>
										)}
										<div className='flex items-center gap-2 text-muted-foreground'>
											<span className='text-xs'>
												{outstation.userCount}{' '}
												{outstation.userCount === 1
													? 'user'
													: 'users'}
											</span>
										</div>
										<div className='text-xs text-muted-foreground'>
											Created{' '}
											{new Date(
												outstation.createdAt
											).toLocaleDateString()}
										</div>
										<Button
											asChild
											variant='outline'
											size='sm'
											className='w-full'
										>
											<Link
												href={`/dashboard/admin/organizations/${outstation.id}`}
											>
												Manage
											</Link>
										</Button>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
