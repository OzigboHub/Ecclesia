'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';
import type { Organization } from '@prisma/client';
import { TransferOutstationModal } from './transfer-outstation-modal';

interface TransferOutstationClientProps {
	outstation: Organization;
	currentParish: Organization | null;
	availableParishes: Organization[];
}

export function TransferOutstationClient({
	outstation,
	currentParish,
	availableParishes,
}: TransferOutstationClientProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				variant='outline'
			>
				<ArrowRightLeft className='h-4 w-4 mr-2' />
				Transfer
			</Button>

			<TransferOutstationModal
				open={open}
				onOpenChange={setOpen}
				outstation={outstation}
				currentParish={currentParish}
				availableParishes={availableParishes}
			/>
		</>
	);
}
