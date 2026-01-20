'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cancelAppointment } from '@/app/actions/appointment.actions';
import { toast } from 'sonner';
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

interface AppointmentDetailClientProps {
	appointmentId: string;
	children: React.ReactNode;
}

export default function AppointmentDetailClient({
	appointmentId,
	children,
}: AppointmentDetailClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isOpen, setIsOpen] = React.useState(false);

	const handleCancel = () => {
		startTransition(async () => {
			const result = await cancelAppointment(appointmentId);
			if (result.success) {
				toast.success('Appointment cancelled successfully');
				setIsOpen(false);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to cancel this appointment? This action
						cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleCancel}
						disabled={isPending}
						className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
					>
						{isPending ? 'Cancelling...' : 'Cancel Appointment'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
