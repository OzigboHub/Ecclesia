'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchParishioners } from '@/app/actions/parishioner.actions';
import { addMember } from '@/app/actions/pious-organization.actions';
import { toast } from 'sonner';
import { Parishioner } from '@prisma/client';

const roles = [
	{ label: 'Member', value: 'MEMBER' },
	{ label: 'President', value: 'PRESIDENT' },
	{ label: 'Vice President', value: 'VICE_PRESIDENT' },
	{ label: 'Secretary', value: 'SECRETARY' },
	{ label: 'Treasurer', value: 'TREASURER' },
	{ label: 'PRO', value: 'PRO' },
	{ label: 'Other', value: 'OTHER' },
];

export function AddMemberDialog({
	organizationId,
}: {
	organizationId: string;
}) {
	const [open, setOpen] = useState(false);
	const [openCombobox, setOpenCombobox] = useState(false);
	const [selectedParishioner, setSelectedParishioner] =
		useState<Parishioner | null>(null);
	const [selectedRole, setSelectedRole] = useState('MEMBER');
	const [searchTerm, setSearchTerm] = useState('');
	const [parishioners, setParishioners] = useState<Parishioner[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleSearch = async (value: string) => {
		setSearchTerm(value);
		if (value.length < 2) {
			setParishioners([]);
			return;
		}

		setIsSearching(true);
		try {
			const result = await searchParishioners(value);
			if (result.success && result.data) {
				setParishioners(result.data);
			} else {
				setParishioners([]);
			}
		} catch (error) {
			console.error(error);
			toast.error('Failed to search parishioners');
		} finally {
			setIsSearching(false);
		}
	};

	const handleSubmit = () => {
		if (!selectedParishioner) return;

		startTransition(async () => {
			const result = await addMember(organizationId, {
				parishionerId: selectedParishioner.id,
				role: selectedRole,
			});

			if (result.success) {
				toast.success(result.message);
				setOpen(false);
				setSelectedParishioner(null);
				setSelectedRole('MEMBER');
				setSearchTerm('');
				router.refresh();
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger asChild>
				<Button>
					<Plus className='mr-2 h-4 w-4' />
					Add Member
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add New Member</DialogTitle>
					<DialogDescription>
						Search for a parishioner and assign them a role in the
						organization.
					</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<div className='flex flex-col gap-2'>
						<label className='text-sm font-medium'>
							Parishioner
						</label>
						<Popover
							open={openCombobox}
							onOpenChange={setOpenCombobox}
						>
							<PopoverTrigger asChild>
								<Button
									variant='outline'
									role='combobox'
									aria-expanded={openCombobox}
									className='w-full justify-between'
								>
									{selectedParishioner
										? `${selectedParishioner.firstName} ${selectedParishioner.lastName}`
										: 'Select parishioner...'}
									<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
								</Button>
							</PopoverTrigger>
							<PopoverContent className='w-[400px] p-0'>
								<Command shouldFilter={false}>
									<CommandInput
										placeholder='Search parishioner name...'
										value={searchTerm}
										onValueChange={handleSearch}
									/>
									<CommandList>
										<CommandEmpty>
											{isSearching
												? 'Searching...'
												: 'No parishioner found.'}
										</CommandEmpty>
										<CommandGroup>
											{parishioners.map((parishioner) => (
												<CommandItem
													key={parishioner.id}
													value={parishioner.id}
													onSelect={() => {
														setSelectedParishioner(
															parishioner
														);
														setOpenCombobox(false);
													}}
												>
													<Check
														className={cn(
															'mr-2 h-4 w-4',
															selectedParishioner?.id ===
																parishioner.id
																? 'opacity-100'
																: 'opacity-0'
														)}
													/>
													{parishioner.firstName}{' '}
													{parishioner.lastName}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>
					<div className='flex flex-col gap-2'>
						<label className='text-sm font-medium'>Role</label>
						<Select
							value={selectedRole}
							onValueChange={setSelectedRole}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{roles.map((role) => (
									<SelectItem
										key={role.value}
										value={role.value}
									>
										{role.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant='outline'
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!selectedParishioner || isPending}
					>
						{isPending && (
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
						)}
						Add Member
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
