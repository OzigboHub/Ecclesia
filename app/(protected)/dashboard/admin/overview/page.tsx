import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    getSystemMetrics,
    getRecentSystemActivity,
} from '@/app/actions/super-admin.actions';
import {
    Users,
    Building2,
    UserCircle,
    UsersRound,
    BookOpen,
    Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SuperAdminOverviewPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const [metricsResult, activityResult] = await Promise.all([
		getSystemMetrics(),
		getRecentSystemActivity(15),
	]);

	const metrics = metricsResult.data;
	const activities = activityResult.data || [];

	const metricCards = [
		{
			title: 'Total Parishes',
			value: metrics?.totalParishes || 0,
			icon: Building2,
			description: 'Active parishes',
			href: '/dashboard/admin/organizations?level=PARISH',
		},
		{
			title: 'Outstations',
			value: metrics?.totalOutstations || 0,
			icon: Building2,
			description: 'Active outstations',
			href: '/dashboard/admin/organizations?level=OUTSTATION',
		},
		{
			title: 'Total Users',
			value: metrics?.totalUsers || 0,
			icon: Users,
			description: 'System users',
			href: '/dashboard/admin/users',
		},
		{
			title: 'Parishioners',
			value: metrics?.totalParishioners || 0,
			icon: UserCircle,
			description: 'Registered parishioners',
		},
		{
			title: 'Societies',
			value: metrics?.totalSocieties || 0,
			icon: UsersRound,
			description: 'Active societies',
		},
		{
			title: 'Sacramental Records',
			value: metrics?.totalSacramentalRecords || 0,
			icon: BookOpen,
			description: 'Total records',
		},
	];

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-3xl font-bold tracking-tight'>
					System Overview
				</h1>
				<p className='text-muted-foreground mt-2'>
					Monitor and manage your entire parish management system
				</p>
			</div>

			{/* Metrics Grid */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{metricCards.map((metric) => (
					<Card key={metric.title}>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								{metric.title}
							</CardTitle>
							<metric.icon className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{metric.value.toLocaleString()}
							</div>
							<p className='text-xs text-muted-foreground'>
								{metric.description}
							</p>
							{metric.href && (
								<Link href={metric.href}>
									<Button
										variant='link'
										size='sm'
										className='px-0 mt-2'
									>
										View Details →
									</Button>
								</Link>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent className='grid gap-4 md:grid-cols-3'>
					<Link href='/dashboard/admin/organizations'>
						<Button className='w-full' variant='outline'>
							<Building2 className='h-4 w-4 mr-2' />
							Manage Organizations
						</Button>
					</Link>
					<Link href='/dashboard/admin/global-actions'>
						<Button className='w-full' variant='outline'>
							<Activity className='h-4 w-4 mr-2' />
							Global Actions
						</Button>
					</Link>
					<Link href='/dashboard/admin/organizations/new'>
						<Button className='w-full'>
							<Building2 className='h-4 w-4 mr-2' />
							Create Parish
						</Button>
					</Link>
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						Recent System Activity
					</CardTitle>
				</CardHeader>
				<CardContent>
					{activities.length === 0 ? (
						<p className='text-sm text-muted-foreground text-center py-6'>
							No recent activity
						</p>
					) : (
						<div className='space-y-4'>
							{activities.map((activity) => (
								<div
									key={activity.id}
									className='flex items-start gap-4 pb-4 border-b last:border-0'
								>
									<div
										className={`h-2 w-2 rounded-full mt-2 ${
											activity.type === 'user_created'
												? 'bg-blue-500'
												: activity.type === 'parishioner_created'
												? 'bg-green-500'
												: 'bg-purple-500'
										}`}
									/>
									<div className='flex-1 space-y-1'>
										<p className='text-sm'>
											{activity.description}
										</p>
										<div className='flex items-center gap-2 text-xs text-muted-foreground'>
											<Link
												href={`/dashboard/admin/organizations/${activity.organizationId}`}
												className='hover:underline'
											>
												{activity.organizationName}
											</Link>
											<span>•</span>
											<span>
												{new Date(
													activity.createdAt
												).toLocaleString()}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
