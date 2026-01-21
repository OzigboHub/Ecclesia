'use client';

import { useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createsocietySchema,
	type CreatesocietyInput,
} from '@/lib/validators/pious-organization.schema';
import {
	createsociety,
	updatesociety,
} from '@/app/actions/society.actions';
import { getParishioners } from '@/app/actions/parishioner.actions';
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
import type { Parishioner } from '@prisma/client';

interface OrganizationFormProps {
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

export function OrganizationForm({
	initialData,
	onSuccess,
}: OrganizationFormProps) {
	const [isPending, startTransition] = useTransition();
	const [parishioners, setParishioners] = useState<Parishioner[]>([]);
	const router = useRouter();

	const form = useForm<CreatesocietyInput>({
		resolver: zodResolver(createsocietySchema),
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

	// Fetch parishioners for president/secretary selection
	useEffect(() => {
		async function fetchParishioners() {
			const result = await getParishioners();
			if (result.success && result.data) {
				setParishioners(result.data);
			}
		}
		fetchParishioners();
	}, []);

	const onSubmit = (data: CreatesocietyInput) => {
		startTransition(async () => {
			const result =
				initialData?.id ?
					await updatesociety(initialData.id, data)
					: await createsociety(data);

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
									field as keyof CreatesocietyInput,
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
			{/* Organization Name */}
			<div className='space-y-2'>
				<Label htmlFor='name'>Organization Name *</Label>
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
					placeholder="Describe the organization's purpose and activities..."
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
									{parishioners.map((p) => (
										<SelectItem
											key={p.id}
											value={p.id}
										>
											{p.firstName} {p.lastName}
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
									{parishioners.map((p) => (
										<SelectItem
											key={p.id}
											value={p.id}
										>
											{p.firstName} {p.lastName}
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
							'Update Organization'
							: 'Create Organization'}
				</Button>
			</div>
		</form>
	);
}
