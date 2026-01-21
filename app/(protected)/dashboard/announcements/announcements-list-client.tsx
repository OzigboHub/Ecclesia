'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { AnnouncementForm } from '@/components/forms/announcement-form';
import { deleteAnnouncement } from '@/app/actions/announcement.actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AnnouncementItem = {
	id: string;
	title: string;
	content: string;
	targetLevels: Array<'PARISH' | 'OUTSTATION'>;
	isPublished: boolean;
	publishedAt: Date | string | null;
	expiresAt: Date | string | null;
	createdAt: Date | string;
	organization: {
		id: string;
		name: string;
		level: 'PARISH' | 'OUTSTATION';
	};
};

const statusOptions = [
	{ value: 'all', label: 'All Statuses' },
	{ value: 'draft', label: 'Draft' },
	{ value: 'scheduled', label: 'Scheduled' },
	{ value: 'active', label: 'Active' },
	{ value: 'expired', label: 'Expired' },
] as const;

function toDate(value?: Date | string | null) {
	if (!value) return null;
	return new Date(value);
}

function getAnnouncementStatus(announcement: AnnouncementItem) {
	if (!announcement.isPublished) return 'draft';
	const now = new Date();
	const publishedAt = toDate(announcement.publishedAt);
	const expiresAt = toDate(announcement.expiresAt);
	if (publishedAt && publishedAt > now) {
		return 'scheduled';
	}
	if (expiresAt && expiresAt <= now) {
		return 'expired';
	}
	return 'active';
}

function formatDate(value?: Date | string | null) {
	const date = toDate(value);
	if (!date) return '-';
	return date.toLocaleString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function AnnouncementsListClient({
	announcements,
}: {
	announcements: AnnouncementItem[];
}) {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [editing, setEditing] = React.useState<AnnouncementItem | null>(null);
	const [statusFilter, setStatusFilter] = React.useState('all');
	const [isPending, startTransition] = React.useTransition();

	const filteredAnnouncements = React.useMemo(() => {
		if (statusFilter === 'all') return announcements;
		return announcements.filter(
			(announcement) => getAnnouncementStatus(announcement) === statusFilter
		);
	}, [announcements, statusFilter]);

	const openCreate = () => {
		setEditing(null);
		setIsModalOpen(true);
	};

	const openEdit = (announcement: AnnouncementItem) => {
		setEditing(announcement);
		setIsModalOpen(true);
	};

	const handleDelete = (id: string) => {
		if (!confirm('Delete this announcement? This cannot be undone.')) return;
		startTransition(async () => {
			const result = await deleteAnnouncement(id);
			if (result.success) {
				toast.success(result.message);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		});
	};

	const columns = [
		{
			header: 'Title',
			accessorKey: 'title',
			cell: (row: AnnouncementItem) => (
				<div className='space-y-1'>
					<p className='font-medium text-foreground'>{row.title}</p>
					<p className='text-xs text-muted-foreground line-clamp-2'>
						{row.content}
					</p>
				</div>
			),
		},
		{
			header: 'Audience',
			accessorKey: 'targetLevels',
			cell: (row: AnnouncementItem) => (
				<div className='flex flex-wrap gap-1'>
					{row.targetLevels.map((level) => (
						<span
							key={level}
							className='text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground'
						>
							{level}
						</span>
					))}
				</div>
			),
		},
		{
			header: 'Schedule',
			accessorKey: 'publishedAt',
			cell: (row: AnnouncementItem) => (
				<div className='text-xs text-muted-foreground space-y-1'>
					<div>
						<span className='font-semibold text-foreground'>Publish:</span>{' '}
						{formatDate(row.publishedAt)}
					</div>
					<div>
						<span className='font-semibold text-foreground'>Expires:</span>{' '}
						{formatDate(row.expiresAt)}
					</div>
				</div>
			),
		},
		{
			header: 'Status',
			accessorKey: 'status',
			cell: (row: AnnouncementItem) => {
				const status = getAnnouncementStatus(row);
				return (
					<span
						className={cn(
							'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
							status === 'active' &&
								'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
							status === 'scheduled' &&
								'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
							status === 'expired' &&
								'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
							status === 'draft' &&
								'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
						)}
					>
						{status}
					</span>
				);
			},
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl sm:text-3xl font-bold text-foreground'>
						Announcements
					</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Create and schedule parish announcements.
					</p>
				</div>
				<div className='flex gap-2'>
					<Select
						value={statusFilter}
						onValueChange={setStatusFilter}
					>
						<SelectTrigger className='w-[160px]'>
							<SelectValue placeholder='Status' />
						</SelectTrigger>
						<SelectContent>
							{statusOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button onClick={openCreate}>
						<Plus className='mr-2 h-4 w-4' /> New Announcement
					</Button>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={filteredAnnouncements}
				actions={(row) => (
					<div className='flex justify-end gap-2'>
						<Button
							size='sm'
							variant='outline'
							onClick={() => openEdit(row)}
							disabled={isPending}
						>
							<Pencil className='h-4 w-4' />
						</Button>
						<Button
							size='sm'
							variant='ghost'
							onClick={() => handleDelete(row.id)}
							disabled={isPending}
						>
							<Trash2 className='h-4 w-4 text-destructive' />
						</Button>
					</div>
				)}
			/>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={editing ? 'Edit Announcement' : 'New Announcement'}
				className='max-w-2xl'
			>
				<AnnouncementForm
					announcement={
						editing
							? {
									id: editing.id,
									title: editing.title,
									content: editing.content,
									targetLevels: editing.targetLevels,
									publishAt: toDate(editing.publishedAt) ?? new Date(),
									expiresAt: toDate(editing.expiresAt) ?? undefined,
								}
							: undefined
					}
					onSuccess={() => {
						setIsModalOpen(false);
						setEditing(null);
					}}
				/>
			</Modal>
		</div>
	);
}
