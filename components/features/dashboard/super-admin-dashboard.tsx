import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSystemMetrics } from '@/app/actions/dashboard.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Building2,
	Users,
	UserCheck,
	Church,
	Calendar,
	BarChart3,
	Settings,
	Plus,
} from 'lucide-react';
import { NairaSign } from '@/components/ui/naira-sign';

export async function SuperAdminDashboard() {
	const session = await auth();

	// Safety check - should not render if not super admin
	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const result = await getSystemMetrics();
	if (!result.success) {
		return (
			<div className='p-6 border border-destructive/50 rounded-lg bg-destructive/10'>
				<p className='text-destructive'>
					Failed to load system metrics
				</p>
			</div>
		);
	}

	const metrics = result.data!;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold tracking-tight'>
					System Dashboard
				</h1>
				<p className='text-muted-foreground'>
					Platform-wide overview and administration
				</p>
			</div>

			{/* System Metrics Grid */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{/* Organizations */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Organizations
						</CardTitle>
						<Building2 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{metrics.totalOrganizations}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							{metrics.totalParishes} parishes,{' '}
							{metrics.totalOutstations} outstations
						</p>
					</CardContent>
				</Card>

				{/* Users */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Users
						</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{metrics.totalUsers}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							{metrics.activeUsers} active (
							{metrics.averageUsersPerOrg} per org)
						</p>
					</CardContent>
				</Card>

				{/* Parishioners */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Parishioners
						</CardTitle>
						<UserCheck className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{metrics.totalParishioners}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							Registered members
						</p>
					</CardContent>
				</Card>

				{/* Total Payments */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Payments
						</CardTitle>
						<NairaSign className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{formatCurrency(metrics.totalPaymentAmount)}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							{metrics.totalPayments} transactions
						</p>
					</CardContent>
				</Card>

				{/* Mass Intentions */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Mass Intentions
						</CardTitle>
						<Church className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{metrics.totalMassIntentions}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							Total booked
						</p>
					</CardContent>
				</Card>

				{/* Appointments */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Appointments
						</CardTitle>
						<Calendar className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{metrics.totalAppointments}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							Total scheduled
						</p>
					</CardContent>
				</Card>

				{/* Active Users % */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Active Users %
						</CardTitle>
						<BarChart3 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{metrics.totalUsers > 0
								? Math.round(
										(metrics.activeUsers /
											metrics.totalUsers) *
											100
								  )
								: 0}
							%
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							{metrics.activeUsers} of {metrics.totalUsers} users
						</p>
					</CardContent>
				</Card>

				{/* Payments per Organization */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Avg Payments/Org
						</CardTitle>
						<NairaSign className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{metrics.totalOrganizations > 0
								? Math.round(
										metrics.totalPayments /
											metrics.totalOrganizations
								  )
								: 0}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							per organization
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick Admin Actions */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='h-5 w-5' />
						Admin Actions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
						<Link href='/dashboard/admin/organizations'>
							<Button
								variant='outline'
								className='w-full justify-start'
							>
								<Building2 className='h-4 w-4 mr-2' />
								Manage Organizations
							</Button>
						</Link>
						<Link href='/dashboard/admin/organizations/new'>
							<Button
								variant='outline'
								className='w-full justify-start'
							>
								<Plus className='h-4 w-4 mr-2' />
								Create Parish
							</Button>
						</Link>
						<Link href='/dashboard/users'>
							<Button
								variant='outline'
								className='w-full justify-start'
							>
								<Users className='h-4 w-4 mr-2' />
								View All Users
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
