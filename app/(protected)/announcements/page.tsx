import { getPublicAnnouncements } from '@/app/actions/announcement.actions';

type Announcement = {
	id: string;
	title: string;
	content: string;
	organizationId: string;
	isPublished: boolean;
	publishedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
		organization?: {
			id: string;
			name: string;
			level: string;
		};
};

function formatDate(value?: Date | null) {
	if (!value) return '';
	return new Date(value).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

export default async function PublicAnnouncementsPage() {
	const result = await getPublicAnnouncements();

	if (!result.success) {
		return (
			<div className='max-w-4xl mx-auto px-4 py-12'>
				<h1 className='text-3xl font-bold'>Announcements</h1>
				<p className='mt-4 text-muted-foreground'>{result.message}</p>
			</div>
		);
	}

	const announcements: Announcement[] = result.data ?? [];

	return (
		<div className='max-w-4xl mx-auto px-4 py-12 space-y-8'>
			<div>
				<h1 className='text-3xl font-bold'>Announcements</h1>
				<p className='text-muted-foreground mt-2'>
					Latest updates from parishes and outstations.
				</p>
			</div>

			{announcements.length === 0 ? (
				<div className='rounded-lg border bg-card p-6 text-muted-foreground'>
					No announcements are available right now.
				</div>
			) : (
				<div className='space-y-4'>
					{announcements.map((announcement: Announcement) => (
						<article
							key={announcement.id}
							className='rounded-lg border border-border bg-background p-6 shadow-sm'
						>
							<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
								<div>
									<h2 className='text-xl font-semibold text-foreground'>
										{announcement.title}
									</h2>
									<p className='text-sm text-muted-foreground'>
										{announcement.organization?.name ?? announcement.organizationId} •{' '}
										{announcement.organization?.level ?? ''}
									</p>
								</div>
								<span className='text-sm text-muted-foreground'>
									{formatDate(announcement.publishedAt)}
								</span>
							</div>
							<p className='mt-4 text-sm text-foreground whitespace-pre-line'>
								{announcement.content}
							</p>
						</article>
					))}
				</div>
			)}
		</div>
	);
}
