'use client';

import { useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    createSocietySchema,
    type CreateSocietyInput,
} from '@/lib/validators/society.schema';
import {
    createSociety,
    updateSociety,
} from '@/app/actions/society.actions';
import { getUsers } from '@/app/actions/user.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SocietyFormProps {
	initialData?: {
		id: string;
		name: string;
		description?: string | null;
		patronSaint?: string | null;
		presidentId?: string | null;
		secretaryId?: string | null;
		meetingSchedule?: string | null;
	};
	onSuccess?: () => void;
}

export function SocietyForm({
	initialData,
	onSuccess,
}: SocietyFormProps) {
	const [isPending, startTransition] = useTransition();
	const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
	const router = useRouter();

	const form = useForm<CreateSocietyInput>({
		resolver: zodResolver(createSocietySchema) as Resolver<CreateSocietyInput>,
		defaultValues: {
			name: initialData?.name ?? '',
			description: initialData?.description ?? '',
			patronSaint: initialData?.patronSaint ?? '',
			presidentId: initialData?.presidentId ?? '',
			secretaryId: initialData?.secretaryId ?? '',
			meetingSchedule: initialData?.meetingSchedule ?? '',
		},
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setError,
		reset,
	} = form;

	// Fetch users (staff) for president/secretary selection — Society president/secretary are Users
	useEffect(() => {
		async function fetchUsers() {
			const result = await getUsers();
			if (result.success && result.data) {
				setUsers(result.data.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })));
			}
		}
		fetchUsers();
	}, []);

	const onSubmit = (data: CreateSocietyInput) => {
		startTransition(async () => {
			const result =
				initialData?.id ?
					await updateSociety(initialData.id, data)
				:	await createSociety(data);

			if (result.success) {
				toast.success(result.message);
				reset();
				router.refresh();
				onSuccess?.();
			} else {
				toast.error(result.message);

				// Set server-side validation errors on fields
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							if (
								Array.isArray(messages) &&
								messages.length > 0
							) {
								setError(
									field as keyof CreateSocietyInput,
									{
										type: 'server',
										message: messages[0],
									},
								);
							}
						},
					);
				}
			}
		});
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-6'
		>
			{/* Society Name */}
			<div className='space-y-2'>
				<Label htmlFor='name'>Society Name *</Label>
				<Input
					id='name'
					{...register('name')}
					placeholder='e.g., Catholic Women Organization'
					disabled={isPending}
					aria-invalid={!!errors.name}
					aria-describedby={errors.name ? 'name-error' : undefined}
				/>
				{errors.name && (
					<p
						id='name-error'
						className='text-sm text-destructive'
						role='alert'
					>
						{errors.name.message}
					</p>
				)}
			</div>

			{/* Patron Saint */}
			<div className='space-y-2'>
				<Label htmlFor='patronSaint'>Patron Saint</Label>
				<Input
					id='patronSaint'
					{...register('patronSaint')}
					placeholder='e.g., St. Monica'
					disabled={isPending}
					aria-invalid={!!errors.patronSaint}
				/>
				{errors.patronSaint && (
					<p
						className='text-sm text-destructive'
						role='alert'
					>
						{errors.patronSaint.message}
					</p>
				)}
			</div>

			{/* Description */}
			<div className='space-y-2'>
				<Label htmlFor='description'>Description</Label>
				<Textarea
					id='description'
					{...register('description')}
					placeholder="Describe the society's purpose and activities..."
					rows={4}
					disabled={isPending}
					aria-invalid={!!errors.description}
				/>
				{errors.description && (
					<p
						className='text-sm text-destructive'
						role='alert'
					>
						{errors.description.message}
					</p>
				)}
			</div>

			{/* Leaders */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{/* President */}
				<div className='space-y-2'>
					<Label htmlFor='presidentId'>President</Label>
					<Controller
						name='presidentId'
						control={control}
						render={({ field }) => (
							<Select
								value={field.value ?? undefined}
								onValueChange={(value) =>
									field.onChange(
										value === '__none__' ? null : value,
									)
								}
								disabled={isPending}
							>
								<SelectTrigger id='presidentId'>
									<SelectValue placeholder='Select President' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='__none__'>
										None
									</SelectItem>
									{users.map((u) => (
										<SelectItem
											key={u.id}
											value={u.id}
										>
											{u.firstName} {u.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.presidentId && (
						<p
							className='text-sm text-destructive'
							role='alert'
						>
							{errors.presidentId.message}
						</p>
					)}
				</div>

				{/* Secretary */}
				<div className='space-y-2'>
					<Label htmlFor='secretaryId'>Secretary</Label>
					<Controller
						name='secretaryId'
						control={control}
						render={({ field }) => (
							<Select
								value={field.value ?? undefined}
								onValueChange={(value) =>
									field.onChange(
										value === '__none__' ? null : value,
									)
								}
								disabled={isPending}
							>
								<SelectTrigger id='secretaryId'>
									<SelectValue placeholder='Select Secretary' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='__none__'>
										None
									</SelectItem>
									{users.map((u) => (
										<SelectItem
											key={u.id}
											value={u.id}
										>
											{u.firstName} {u.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.secretaryId && (
						<p
							className='text-sm text-destructive'
							role='alert'
						>
							{errors.secretaryId.message}
						</p>
					)}
				</div>
			</div>

			{/* Meeting Schedule */}
			<div className='space-y-2'>
				<Label htmlFor='meetingSchedule'>Meeting Schedule</Label>
				<Input
					id='meetingSchedule'
					{...register('meetingSchedule')}
					placeholder='e.g., Every 2nd Sunday after Mass'
					disabled={isPending}
					aria-invalid={!!errors.meetingSchedule}
				/>
				{errors.meetingSchedule && (
					<p
						className='text-sm text-destructive'
						role='alert'
					>
						{errors.meetingSchedule.message}
					</p>
				)}
			</div>

			{/* Submit Button */}
			<div className='flex justify-end gap-3 pt-4 border-t'>
				<Button
					type='button'
					variant='outline'
					onClick={() => reset()}
					disabled={isPending}
				>
					Reset
				</Button>
				<Button
					type='submit'
					disabled={isPending}
				>
					{isPending ?
						'Saving...'
					: initialData ?
						'Update Society'
					:	'Create Society'}
				</Button>
			</div>
		</form>
	);
}
