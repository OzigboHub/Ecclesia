'use client';

import { approveMassIntention, rejectMassIntention } from '@/app/actions/mass-intention.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function MassIntentionActions({ id, status }: { id: string; status: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [showRejectInput, setShowRejectInput] = useState(false);
	const [rejectReason, setRejectReason] = useState('');

	if (status !== 'PENDING') return null;

	const handleApprove = async () => {
		setLoading(true);
		const result = await approveMassIntention(id);
		if (result.success) {
			router.refresh();
		} else {
			alert(result.message);
		}
		setLoading(false);
	};

	const handleReject = async () => {
		setLoading(true);
		const result = await rejectMassIntention(id, rejectReason || undefined);
		if (result.success) {
			router.refresh();
		} else {
			alert(result.message);
		}
		setLoading(false);
	};

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex gap-2'>
				<Button onClick={handleApprove} disabled={loading} className='bg-green-600 hover:bg-green-700 text-white'>
					<CheckCircle2 className='mr-2 h-4 w-4' /> Approve
				</Button>
				<Button
					variant='destructive'
					onClick={() => setShowRejectInput(!showRejectInput)}
					disabled={loading}
				>
					<XCircle className='mr-2 h-4 w-4' /> Reject
				</Button>
			</div>
			{showRejectInput && (
				<div className='flex gap-2'>
					<Input
						placeholder='Reason for rejection (optional)'
						value={rejectReason}
						onChange={(e) => setRejectReason(e.target.value)}
						disabled={loading}
					/>
					<Button variant='destructive' onClick={handleReject} disabled={loading}>
						Confirm Reject
					</Button>
				</div>
			)}
		</div>
	);
}
