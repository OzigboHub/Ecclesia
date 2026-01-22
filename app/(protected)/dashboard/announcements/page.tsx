import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAnnouncementsFiltered } from '@/app/actions/announcement.actions';
import AnnouncementsListClient from './announcements-list-client';

export default async function AnnouncementsPage() {
	const session = await auth();
	if (!session?.user) redirect('/auth/login');

	const result = await getAnnouncementsFiltered({ page: 1, limit: 200 });

	if (!result.success || !result.data) {
		return (
			<div className='space-y-6'>
				<h1 className='text-3xl font-bold'>Announcements</h1>
				<div className='rounded-lg border bg-card p-6'>
					<p className='text-destructive'>{result.message}</p>
				</div>
			</div>
		);
	}

	return (
		<AnnouncementsListClient announcements={result.data.announcements} />
	);
}
