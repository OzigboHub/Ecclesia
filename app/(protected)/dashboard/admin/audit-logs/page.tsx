import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import { getRecentSystemActivity } from '@/app/actions/super-admin.actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default async function AuditLogsPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const result = await getRecentSystemActivity(50);
	const activities = result.success ? result.data : [];

	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold tracking-tight'>Audit Logs</h1>
				<p className='text-muted-foreground'>
					Track system-wide activity and administrative changes.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<History className='h-5 w-5' />
						Recent System Activity
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Summary</TableHead>
								<TableHead>Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{activities?.map((activity, index) => (
								<TableRow key={index}>
									<TableCell className='font-medium uppercase text-xs'>{activity.type}</TableCell>
									<TableCell>{activity.description}</TableCell>
									<TableCell className='text-muted-foreground text-sm'>
										{activity.createdAt.toLocaleString()}
									</TableCell>
								</TableRow>
							))}
							{activities?.length === 0 && (
								<TableRow>
									<TableCell colSpan={3} className='text-center py-8 text-muted-foreground'>
										No recent activity found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
