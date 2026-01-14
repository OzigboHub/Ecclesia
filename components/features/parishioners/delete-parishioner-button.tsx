'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deleteParishioner } from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteParishionerButtonProps {
	parishionerId: string;
	parishionerName: string;
}

export function DeleteParishionerButton({
	parishionerId,
	parishionerName,
}: DeleteParishionerButtonProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleDelete = () => {
		if (
			!confirm(
				`Are you sure you want to delete ${parishionerName}? This action cannot be undone.`
			)
		) {
			return;
		}

		startTransition(async () => {
			const result = await deleteParishioner(parishionerId);

			if (result.success) {
				toast.success(result.message);
				router.push('/dashboard/parishioners');
				router.refresh();
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<Button
			variant='destructive'
			onClick={handleDelete}
			disabled={isPending}
		>
			{isPending ? (
				<Loader2 className='mr-2 h-4 w-4 animate-spin' />
			) : (
				<Trash2 className='mr-2 h-4 w-4' />
			)}
			{isPending ? 'Deleting...' : 'Delete'}
		</Button>
	);
}
