'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteOrganizationAdminAction } from '@/app/actions/organization.actions';
import { toast } from 'sonner';

interface DeleteOrganizationButtonProps {
	organizationId: string;
	userCount: number;
	parishionerCount: number;
}

export function DeleteOrganizationButton({
	organizationId,
	userCount,
	parishionerCount,
}: DeleteOrganizationButtonProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleDelete = () => {
		startTransition(async () => {
			try {
				const result = await deleteOrganizationAdminAction(organizationId);
				if (result.success) {
					toast.success(result.message);
					router.push('/dashboard/admin/organizations');
					router.refresh();
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				toast.error('An error occurred while deleting the organization');
				console.error(error);
			}
		});
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant='destructive' disabled={isPending}>
					<Trash2 className='h-4 w-4 mr-2' />
					{isPending ? 'Deleting...' : 'Delete'}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Organization</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. Are you sure you want to
						delete this organization?
						{(userCount > 0 || parishionerCount > 0) && (
							<div className='mt-2 p-2 bg-destructive/10 rounded text-sm'>
								This organization has {userCount} users and{' '}
								{parishionerCount} parishioners. They must be
								reassigned or deleted first.
							</div>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isPending}
						className='bg-destructive hover:bg-destructive/90'
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
