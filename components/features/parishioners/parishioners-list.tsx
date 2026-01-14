'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Parishioner } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	deleteParishioner,
	bulkDeleteParishioners,
	exportParishioners,
} from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import { Edit2, Trash2, Eye, Search, Download, X } from 'lucide-react';
import Link from 'next/link';

interface ParishionersListProps {
	parishioners: Parishioner[];
}

export function ParishionersList({
	parishioners: initialParishioners,
}: ParishionersListProps) {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState('');
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	// Filter parishioners based on search
	const filteredParishioners = initialParishioners.filter((p) =>
		`${p.firstName} ${p.lastName} ${p.email} ${p.phone}`
			.toLowerCase()
			.includes(searchTerm.toLowerCase())
	);

	const toggleSelection = (id: string) => {
		const newSelection = new Set(selectedIds);
		if (newSelection.has(id)) {
			newSelection.delete(id);
		} else {
			newSelection.add(id);
		}
		setSelectedIds(newSelection);
	};

	const toggleSelectAll = () => {
		if (selectedIds.size === filteredParishioners.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filteredParishioners.map((p) => p.id)));
		}
	};

	const handleDelete = async (id: string, name: string) => {
		if (!confirm(`Are you sure you want to delete ${name}?`)) return;

		setIsDeleting(id);
		const result = await deleteParishioner(id);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			toast.error(result.message);
		}
		setIsDeleting(null);
	};

	const handleBulkDelete = async () => {
		setIsBulkDeleting(true);
		const result = await bulkDeleteParishioners(Array.from(selectedIds));

		if (result.success) {
			toast.success(result.message);
			setSelectedIds(new Set());
			setShowDeleteDialog(false);
			router.refresh();
		} else {
			toast.error(result.message);
		}
		setIsBulkDeleting(false);
	};

	const handleExport = async () => {
		setIsExporting(true);
		const idsToExport =
			selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
		const result = await exportParishioners(idsToExport);

		if (result.success && result.data) {
			// Create download link
			const blob = new Blob([result.data], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `parishioners-${
				new Date().toISOString().split('T')[0]
			}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success('Export successful');
		} else {
			toast.error(result.message || 'Export failed');
		}
		setIsExporting(false);
	};

	return (
		<div className='space-y-4'>
			{/* Search and Bulk Actions */}
			<div className='flex flex-col md:flex-row gap-4'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						type='search'
						placeholder='Search parishioners...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='pl-10'
					/>
				</div>

				{selectedIds.size > 0 && (
					<div className='flex gap-2'>
						<Button
							variant='outline'
							onClick={handleExport}
							disabled={isExporting}
						>
							<Download className='mr-2 h-4 w-4' />
							Export ({selectedIds.size})
						</Button>
						<Button
							variant='destructive'
							onClick={() => setShowDeleteDialog(true)}
							disabled={isBulkDeleting}
						>
							<Trash2 className='mr-2 h-4 w-4' />
							Delete ({selectedIds.size})
						</Button>
						<Button
							variant='ghost'
							size='icon'
							onClick={() => setSelectedIds(new Set())}
						>
							<X className='h-4 w-4' />
						</Button>
					</div>
				)}
			</div>

			{/* Stats and Select All */}
			<div className='flex items-center justify-between text-sm text-muted-foreground'>
				<div className='flex items-center gap-3'>
					{filteredParishioners.length > 0 && (
						<div className='flex items-center gap-2'>
							<Checkbox
								checked={
									selectedIds.size ===
										filteredParishioners.length &&
									filteredParishioners.length > 0
								}
								onCheckedChange={toggleSelectAll}
								aria-label='Select all parishioners'
							/>
							<span>Select All</span>
						</div>
					)}
					<p>
						Showing {filteredParishioners.length} of{' '}
						{initialParishioners.length} parishioner(s)
					</p>
				</div>

				<Button
					variant='outline'
					size='sm'
					onClick={handleExport}
					disabled={isExporting}
				>
					<Download className='mr-2 h-4 w-4' />
					Export All
				</Button>
			</div>

			{/* List */}
			{filteredParishioners.length === 0 ? (
				<div className='text-center py-8 text-muted-foreground'>
					{searchTerm
						? `No parishioners found matching "${searchTerm}"`
						: 'No parishioners yet. Add your first parishioner to get started.'}
				</div>
			) : (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{filteredParishioners.map((parishioner) => {
						const isSelected = selectedIds.has(parishioner.id);
						const initials =
							`${parishioner.firstName[0]}${parishioner.lastName[0]}`.toUpperCase();

						return (
							<div
								key={parishioner.id}
								className={`rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow ${
									isSelected ? 'ring-2 ring-primary' : ''
								}`}
							>
								<div className='flex items-start gap-3'>
									<Checkbox
										checked={isSelected}
										onCheckedChange={() =>
											toggleSelection(parishioner.id)
										}
										aria-label={`Select ${parishioner.firstName} ${parishioner.lastName}`}
										className='mt-1'
									/>
									<Avatar className='h-12 w-12'>
										<AvatarImage
											src={
												parishioner.photoUrl ||
												undefined
											}
											alt={`${parishioner.firstName} ${parishioner.lastName}`}
										/>
										<AvatarFallback>
											{initials}
										</AvatarFallback>
									</Avatar>
									<div className='flex-1 min-w-0'>
										<h3 className='font-semibold text-lg truncate'>
											{parishioner.firstName}{' '}
											{parishioner.lastName}
										</h3>
										<p className='text-sm text-muted-foreground truncate'>
											{parishioner.email}
										</p>
									</div>
								</div>

								<div className='space-y-1 text-sm'>
									{parishioner.phone && (
										<p className='text-muted-foreground'>
											📱 {parishioner.phone}
										</p>
									)}
									<div className='flex gap-2'>
										<span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary'>
											{parishioner.gender}
										</span>
										{parishioner.maritalStatus && (
											<span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted'>
												{parishioner.maritalStatus}
											</span>
										)}
									</div>
								</div>

								<div className='flex gap-2 pt-2'>
									<Link
										href={`/dashboard/parishioners/${parishioner.id}`}
										className='flex-1'
									>
										<Button
											variant='outline'
											size='sm'
											className='w-full'
										>
											<Eye className='mr-2 h-4 w-4' />
											View
										</Button>
									</Link>
									<Link
										href={`/dashboard/parishioners/${parishioner.id}/edit`}
									>
										<Button
											variant='outline'
											size='sm'
										>
											<Edit2 className='h-4 w-4' />
										</Button>
									</Link>
									<Button
										variant='outline'
										size='sm'
										onClick={() =>
											handleDelete(
												parishioner.id,
												`${parishioner.firstName} ${parishioner.lastName}`
											)
										}
										disabled={isDeleting === parishioner.id}
										className='text-destructive hover:text-destructive'
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Bulk Delete Confirmation Dialog */}
			<AlertDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete {selectedIds.size} Parishioner(s)?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The selected
							parishioners will be permanently deleted from your
							organization.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isBulkDeleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkDelete}
							disabled={isBulkDeleting}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{isBulkDeleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
