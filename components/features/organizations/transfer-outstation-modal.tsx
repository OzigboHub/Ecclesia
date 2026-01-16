'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Organization } from '@prisma/client';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { transferOutstationAdminAction } from '@/app/actions/organization.actions';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface TransferOutstationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	outstation: Organization;
	currentParish: Organization | null;
	availableParishes: Organization[];
}

export function TransferOutstationModal({
	open,
	onOpenChange,
	outstation,
	currentParish,
	availableParishes,
}: TransferOutstationModalProps) {
	const [isPending, startTransition] = useTransition();
	const [selectedParishId, setSelectedParishId] = useState<string>('');
	const router = useRouter();

	// Filter out current parish and the outstation itself
	const validTargetParishes = availableParishes.filter(
		(p) => p.id !== currentParish?.id && p.id !== outstation.id
	);

	const handleTransfer = () => {
		if (!selectedParishId) {
			toast.error('Please select a destination parish');
			return;
		}

		startTransition(async () => {
			const result = await transferOutstationAdminAction({
				outstationId: outstation.id,
				targetParishId: selectedParishId,
			});

			if (result.success) {
				toast.success(result.message);
				onOpenChange(false);
				setSelectedParishId('');
				router.refresh();
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Transfer Outstation</DialogTitle>
					<DialogDescription>
						Move {outstation.name} to a different parish
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					{/* Current Parish Info */}
					<div className='rounded-lg bg-muted p-3'>
						<p className='text-sm text-muted-foreground'>
							Current Parish
						</p>
						<p className='font-semibold'>{currentParish?.name}</p>
					</div>

					{/* Target Parish Selection */}
					<div className='space-y-2'>
						<Label htmlFor='target-parish'>
							Select Destination Parish
						</Label>
						<Select
							value={selectedParishId}
							onValueChange={setSelectedParishId}
							disabled={
								isPending || validTargetParishes.length === 0
							}
						>
							<SelectTrigger id='target-parish'>
								<SelectValue placeholder='Choose a parish...' />
							</SelectTrigger>
							<SelectContent>
								{validTargetParishes.length === 0 ? (
									<SelectItem
										value=''
										disabled
									>
										No other parishes available
									</SelectItem>
								) : (
									validTargetParishes.map((parish) => (
										<SelectItem
											key={parish.id}
											value={parish.id}
										>
											{parish.name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>

					{/* Warning */}
					<Alert>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>
							This will update the outstation&apos;s parent
							organization and affect user access permissions.
						</AlertDescription>
					</Alert>
				</div>

				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						onClick={() => {
							onOpenChange(false);
							setSelectedParishId('');
						}}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleTransfer}
						disabled={
							isPending ||
							!selectedParishId ||
							validTargetParishes.length === 0
						}
					>
						{isPending ? 'Transferring...' : 'Transfer'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
