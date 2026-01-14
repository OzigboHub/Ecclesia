'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Parishioner } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteParishioner } from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import { Edit2, Trash2, Eye, Search } from 'lucide-react';
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

	// Filter parishioners based on search
	const filteredParishioners = initialParishioners.filter((p) =>
		`${p.firstName} ${p.lastName} ${p.email} ${p.phone}`
			.toLowerCase()
			.includes(searchTerm.toLowerCase())
	);

	const handleDelete = async (id: string, name: string) => {
		if (
			!confirm(
				`Are you sure you want to delete ${name}? This action cannot be undone.`
			)
		) {
			return;
		}

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

	if (initialParishioners.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg'>
				<div className='text-center space-y-3'>
					<div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center'>
						<Eye className='h-6 w-6 text-muted-foreground' />
					</div>
					<h3 className='text-lg font-semibold'>
						No parishioners yet
					</h3>
					<p className='text-muted-foreground max-w-sm'>
						Get started by adding your first parishioner to the
						system.
					</p>
					<Link href='/dashboard/parishioners/new'>
						<Button>Add Parishioner</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Search */}
			<div className='relative'>
				<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
				<Input
					type='search'
					placeholder='Search parishioners...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className='pl-10'
				/>
			</div>

			{/* Stats */}
			<div className='flex items-center justify-between text-sm text-muted-foreground'>
				<p>
					Showing {filteredParishioners.length} of{' '}
					{initialParishioners.length} parishioner(s)
				</p>
			</div>

			{/* List */}
			{filteredParishioners.length === 0 ? (
				<div className='text-center py-8 text-muted-foreground'>
					No parishioners found matching &quot;{searchTerm}&quot;
				</div>
			) : (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{filteredParishioners.map((parishioner) => (
						<div
							key={parishioner.id}
							className='rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow'
						>
							<div>
								<h3 className='font-semibold text-lg'>
									{parishioner.firstName}{' '}
									{parishioner.lastName}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{parishioner.email}
								</p>
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
					))}
				</div>
			)}
		</div>
	);
}
