import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, ShieldAlert, Database, FileJson } from 'lucide-react';

export default async function GlobalActionsPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold tracking-tight'>Global Actions</h1>
				<p className='text-muted-foreground'>
					System-wide administrative operations and maintenance.
				</p>
			</div>

			<div className='grid gap-6 md:grid-cols-2'>
				{/* System Announcement */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Megaphone className='h-5 w-5 text-primary' />
							System Announcement
						</CardTitle>
						<CardDescription>
							Send a notification to all users across all organizations.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-2'>
							<Input placeholder='Announcement Title' />
							<Textarea placeholder='Message content...' className='min-h-[100px]' />
						</div>
						<Button className='w-full'>Broadcast Announcement</Button>
					</CardContent>
				</Card>

				{/* Global Feature Management */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<ShieldAlert className='h-5 w-5 text-yellow-500' />
							Bulk Feature Toggle
						</CardTitle>
						<CardDescription>
							Enable or disable a feature for ALL organizations at once.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<p className='text-sm text-muted-foreground'>
							This action is destructive and will overwrite individual organization settings.
						</p>
						<Button variant='outline' className='w-full'>Manage Global Features</Button>
					</CardContent>
				</Card>

				{/* Data Export */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<FileJson className='h-5 w-5 text-blue-500' />
							System Data Export
						</CardTitle>
						<CardDescription>
							Export complete system data for backup or migration.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-2'>
							<Button variant='outline' size='sm'>Export JSON</Button>
							<Button variant='outline' size='sm'>Export CSV</Button>
						</div>
					</CardContent>
				</Card>

				{/* System Health */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Database className='h-5 w-5 text-green-500' />
							Database Maintenance
						</CardTitle>
						<CardDescription>
							Perform routine database cleanup and optimization.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Button variant='secondary' className='w-full text-xs'>Run Cleanup Script</Button>
						<Button variant='secondary' className='w-full text-xs'>Optimize Indexes</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
