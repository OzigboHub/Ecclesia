import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import type { Organization } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Plus, Users, UsersRound, Building2, UserCircle, BookOpen } from 'lucide-react';
import { DeleteOrganizationButton } from '@/components/features/organizations/delete-organization-button';
import { TransferOutstationClient } from '@/components/features/organizations/transfer-outstation-client';
import { getOrganizationDetailedView } from '@/app/actions/super-admin.actions';

interface OrganizationDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function OrganizationDetailPage({
	params,
}: OrganizationDetailPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const { id } = await params;

	const result = await getOrganizationDetailedView(id, 5);

	if (!result.success || !result.data) {
		redirect('/dashboard/admin/organizations');
	}

	const {
		organization,
		users,
		parishioners,
		societies,
		outstations,
		baptisms,
		confirmations,
		marriages,
		counts,
	} = result.data;

	// Fetch all parishes for transfer modal (outstations only)
	let allParishes: Organization[] = [];
	if (organization.level === 'OUTSTATION') {
		allParishes = await db.organization.findMany({
			where: { level: 'PARISH' },
			orderBy: { name: 'asc' },
		});
	}

	// Get parent info if it's an outstation
	const parent = organization.parentId
		? await db.organization.findUnique({ where: { id: organization.parentId }, select: { name: true } })
		: null;

	const isParish = organization.level === 'PARISH';

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
					<div className='flex items-center gap-4 mt-2'>
						<Badge variant='outline'>
							{organization.level === 'PARISH'
								? '⛪ Parish'
								: '🏛️ Outstation'}
						</Badge>
						{!isParish && parent && (
							<div className='text-sm text-muted-foreground'>
								Parent: {parent.name}
							</div>
						)}
						<Link href={`/dashboard/admin/organizations/${id}/settings`}>
							<Button variant='outline' size='sm'>
								Settings
							</Button>
						</Link>
					</div>
				</div>
				<div className='flex gap-2'>
					<Link
						href={`/dashboard/admin/organizations/${id}/edit`}
					>
						<Button>
							<Edit className='h-4 w-4 mr-2' />
							Edit
						</Button>
					</Link>
					{!isParish && (
						<TransferOutstationClient
							outstation={organization}
							currentParish={parent as any}
							availableParishes={allParishes}
						/>
					)}
					<DeleteOrganizationButton
						organizationId={id}
						userCount={counts.totalUsers}
						parishionerCount={counts.totalParishioners}
					/>
				</div>
			</div>

			{/* Info Grid */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<MetricCard title='Users' count={counts.totalUsers} icon={Users} />
				<MetricCard title='Parishioners' count={counts.totalParishioners} icon={UserCircle} />
				<MetricCard title='Societies' count={counts.totalSocieties} icon={UsersRound} />
				{isParish ? (
					<MetricCard title='Outstations' count={counts.totalOutstations} icon={Building2} />
				) : (
					<MetricCard title='Sacramental' count={counts.totalBaptisms + counts.totalConfirmations + counts.totalMarriages} icon={BookOpen} />
				)}
			</div>

			<div className='grid gap-6 lg:grid-cols-3'>
				{/* Main Relations Columns (2/3) */}
				<div className='lg:col-span-2 space-y-6'>
					{/* Users Section */}
					<Card>
						<CardHeader className='flex flex-row items-center justify-between'>
							<CardTitle>Users</CardTitle>
							{counts.totalUsers > 5 && (
								<Link href={`/dashboard/admin/organizations/${id}/users`}>
									<Button variant='outline' size='sm'>
										View All
									</Button>
								</Link>
							)}
						</CardHeader>
						<CardContent>
							{users.length === 0 ? (
								<p className='text-sm text-muted-foreground py-4 text-center'>No users registered</p>
							) : (
								<div className='space-y-2'>
									{users.map((user) => (
										<div key={user.id} className='flex items-center justify-between p-3 rounded-lg border'>
											<div>
												<p className='font-medium text-sm'>{user.firstName} {user.lastName}</p>
												<Badge variant='secondary' className='text-[10px]'>{user.role}</Badge>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Parishioners Section */}
					<Card>
						<CardHeader className='flex flex-row items-center justify-between'>
							<CardTitle>Recent Parishioners</CardTitle>
							{counts.totalParishioners > 5 && (
								<Link href={`/dashboard/admin/organizations/${id}/parishioners`}>
									<Button variant='outline' size='sm'>
										View All
									</Button>
								</Link>
							)}
						</CardHeader>
						<CardContent>
							{parishioners.length === 0 ? (
								<p className='text-sm text-muted-foreground py-4 text-center'>No parishioners registered</p>
							) : (
								<div className='space-y-2'>
									{parishioners.map((p) => (
										<div key={p.id} className='p-3 rounded-lg border flex justify-between items-center'>
											<div>
												<p className='font-medium text-sm'>{p.firstName} {p.lastName}</p>
												<p className='text-[10px] text-muted-foreground'>{p.gender} • {p.maritalStatus || 'N/A'}</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Sidebar Relations Column (1/3) */}
				<div className='space-y-6'>
					{/* Sacramental Summary */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg flex items-center gap-2'>
								<BookOpen className='h-4 w-4' />
								Sacramental Records
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-3 gap-2'>
								<SacramentBrief count={counts.totalBaptisms} label='Baptisms' />
								<SacramentBrief count={counts.totalConfirmations} label='Confirm.' />
								<SacramentBrief count={counts.totalMarriages} label='Marriages' />
							</div>

							<div className='space-y-3 mt-4'>
								<p className='text-[11px] font-bold uppercase text-muted-foreground'>Recent Activity</p>
								{[
									...baptisms.map(b => ({ id: b.id, type: 'Baptism', date: b.date })),
									...confirmations.map(c => ({ id: c.id, type: 'Confirmation', date: c.date })),
									...marriages.map(m => ({ id: m.id, type: 'Marriage', date: m.date })),
								].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
								.slice(0, 5)
								.map((record, k) => (
									<div key={record.id || k} className='text-xs flex justify-between p-2 rounded bg-muted/50'>
										<span className='font-medium'>{record.type}</span>
										<span className='text-muted-foreground'>{new Date(record.date).toLocaleDateString()}</span>
									</div>
								))}
								{baptisms.length + confirmations.length + marriages.length === 0 && (
									<p className='text-xs text-muted-foreground text-center py-2'>No recent records</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Societies Section */}
					<Card>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<CardTitle className='text-lg'>Societies</CardTitle>
							{counts.totalSocieties > 5 && (
								<Link href={`/dashboard/admin/organizations/${id}/societies`}>
									<Button variant='link' size='sm' className='h-auto p-0'>View All</Button>
								</Link>
							)}
						</CardHeader>
						<CardContent>
							{societies.length === 0 ? (
								<p className='text-xs text-muted-foreground text-center py-4'>No societies</p>
							) : (
								<div className='space-y-1'>
									{societies.map((s) => (
										<div key={s.id} className='text-xs p-2 rounded hover:bg-muted transition-colors'>
											{s.name}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Outstations Section (if Parish) */}
			{isParish && (
				<Card>
					<CardHeader className='flex flex-row items-center justify-between'>
						<CardTitle>Outstations</CardTitle>
						<div className='flex gap-2'>
							{counts.totalOutstations > 5 && (
								<Link href={`/dashboard/admin/organizations/${id}/outstations`}>
									<Button variant='outline' size='sm'>
										View All
									</Button>
								</Link>
							)}
							<Link
								href={`/dashboard/admin/organizations/${id}/new-outstation`}
							>
								<Button size='sm'>
									<Plus className='h-4 w-4 mr-2' />
									Add
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{outstations.length === 0 ? (
							<p className='text-sm text-muted-foreground py-4 text-center'>No outstations yet</p>
						) : (
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{outstations.map((outstation) => (
									<Link
										key={outstation.id}
										href={`/dashboard/admin/organizations/${outstation.id}`}
									>
										<div className='p-4 rounded-lg border hover:bg-accent transition-colors h-full'>
											<p className='font-medium text-sm'>
												{outstation.name}
											</p>
											{outstation.address && (
												<p className='text-xs text-muted-foreground line-clamp-1'>
													{outstation.address}
												</p>
											)}
										</div>
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function MetricCard({ title, count, icon: Icon }: { title: string, count: number, icon: any }) {
	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium'>{title}</CardTitle>
				<Icon className='h-4 w-4 text-muted-foreground' />
			</CardHeader>
			<CardContent>
				<div className='text-2xl font-bold'>{count}</div>
			</CardContent>
		</Card>
	);
}

function SacramentBrief({ count, label }: { count: number, label: string }) {
	return (
		<div className='flex flex-col items-center justify-center p-2 rounded-lg bg-primary/5 border border-primary/10'>
			<span className='text-lg font-bold text-primary'>{count}</span>
			<span className='text-[9px] uppercase tracking-tighter font-semibold text-muted-foreground'>{label}</span>
		</div>
	);
}
