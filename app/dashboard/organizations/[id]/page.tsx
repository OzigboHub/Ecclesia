import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPiousOrganization } from '@/app/actions/pious-organization.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Edit2, ArrowLeft } from 'lucide-react';
import { AddMemberDialog } from '@/components/organizations/add-member-dialog';
import { MemberListItem } from '@/components/organizations/member-list-item';
import { CreateMeetingDialog } from '@/components/organizations/create-meeting-dialog';

interface OrganizationDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({
	params,
}: OrganizationDetailPageProps) {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	// Await params (Next.js 16 pattern)
	const { id } = await params;

	const result = await getPiousOrganization(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const organization = result.data;

	return (
		<div className='space-y-6'>
			<div className='flex items-center gap-4'>
				<Button
					variant='ghost'
					size='icon'
					asChild
				>
					<Link href='/dashboard/organizations'>
						<ArrowLeft className='h-4 w-4' />
					</Link>
				</Button>
				<div className='flex-1'>
					<h1 className='text-3xl font-bold tracking-tight'>
						{organization.name}
					</h1>
					<div className='flex items-center text-muted-foreground mt-1 gap-4 text-sm'>
						<span className='flex items-center gap-1'>
							<Users className='h-3 w-3' />{' '}
							{organization.members.length} Members
						</span>
					</div>
				</div>
				<Button
					variant='outline'
					asChild
				>
					<Link
						href={`/dashboard/organizations/${organization.id}/edit`}
					>
						<Edit2 className='h-4 w-4 mr-2' /> Edit
					</Link>
				</Button>
			</div>

			<div className='grid gap-6 md:grid-cols-3'>
				<div className='md:col-span-2 space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>About</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='whitespace-pre-wrap text-muted-foreground'>
								{organization.description ||
									'No description provided.'}
							</p>
						</CardContent>
					</Card>

					<Tabs
						defaultValue='members'
						className='w-full'
					>
						<TabsList>
							<TabsTrigger value='members'>Members</TabsTrigger>
							<TabsTrigger value='events'>
								Events & Activities
							</TabsTrigger>
							<TabsTrigger value='documents'>
								Documents
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value='members'
							className='mt-4'
						>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<CardTitle>Members List</CardTitle>
									<AddMemberDialog
										organizationId={organization.id}
									/>
								</CardHeader>
								<CardContent>
									{organization.members.length === 0 ? (
										<div className='text-center py-6 text-muted-foreground'>
											<p>No members registered yet.</p>
										</div>
									) : (
										<ul className='divide-y'>
											{organization.members.map(
												(membership) => (
													<MemberListItem
														key={
															membership.parishionerId
														}
														organizationId={
															organization.id
														}
														membership={membership}
													/>
												)
											)}
										</ul>
									)}
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent
							value='events'
							className='mt-4'
						>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<CardTitle>Upcoming Events</CardTitle>
									<CreateMeetingDialog
										piousOrganizationId={organization.id}
									/>
								</CardHeader>
								<CardContent>
									{organization.events.length === 0 ? (
										<p className='text-muted-foreground text-sm'>
											No events scheduled.
										</p>
									) : (
										<ul className='space-y-2'>
											{organization.events.map(
												(event) => (
													<li
														key={event.id}
														className='p-3 border rounded-md'
													>
														<p className='font-medium'>
															{event.title}
														</p>
														<p className='text-xs text-muted-foreground'>
															{new Date(
																event.startTime
															).toLocaleString()}
														</p>
													</li>
												)
											)}
										</ul>
									)}
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent
							value='documents'
							className='mt-4'
						>
							<div className='p-4 text-center text-muted-foreground text-sm'>
								Coming soon...
							</div>
						</TabsContent>
					</Tabs>
				</div>

				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Leadership</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div>
								<p className='text-xs font-medium text-muted-foreground uppercase'>
									President
								</p>
								<p className='font-medium'>
									{organization.president
										? `${organization.president.firstName} ${organization.president.lastName}`
										: 'Vacant'}
								</p>
							</div>
							<div>
								<p className='text-xs font-medium text-muted-foreground uppercase'>
									Secretary
								</p>
								<p className='font-medium'>
									{organization.secretary
										? `${organization.secretary.firstName} ${organization.secretary.lastName}`
										: 'Vacant'}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
