'use client';

import { useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createAppointmentSchema,
	type CreateAppointmentInput,
} from '@/lib/validators/appointment.schema';
import { createAppointment } from '@/app/actions/appointment.actions';
import { getParishioners } from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AppointmentFormProps {
	onSuccess?: () => void;
}

interface Parishioner {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
}

export function AppointmentForm({ onSuccess }: AppointmentFormProps) {
	const [isPending, startTransition] = useTransition();
	const [parishioners, setParishioners] = useState<Parishioner[]>([]);
	const [isLoadingParishioners, setIsLoadingParishioners] = useState(true);
	const router = useRouter();

	const form = useForm<CreateAppointmentInput>({
		resolver: zodResolver(createAppointmentSchema),
		defaultValues: {
			title: '',
			description: '',
			type: 'MEETING',
			startTime: '',
			endTime: '',
			assignedToId: '',
			parishionerId: '',
			notes: '',
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

	// Load parishioners
	useEffect(() => {
		async function loadParishioners() {
			const result = await getParishioners();
			if (result.success && result.data) {
				setParishioners(result.data);
			}
			setIsLoadingParishioners(false);
		}
		loadParishioners();
	}, []);

	const onSubmit = (data: CreateAppointmentInput) => {
		startTransition(async () => {
			const result = await createAppointment(data);

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
							setError(field as keyof CreateAppointmentInput, {
								type: 'server',
								message: messages[0],
							});
						}
					);
				}
			}
		});
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-4'
		>
			{/* Appointment Title */}
			<div className='space-y-2'>
				<Label htmlFor='title'>Appointment Title *</Label>
				<Input
					id='title'
					{...register('title')}
					placeholder='e.g., Wedding Counseling'
					disabled={isPending}
					aria-invalid={!!errors.title}
					aria-describedby={errors.title ? 'title-error' : undefined}
				/>
				{errors.title && (
					<p
						id='title-error'
						className='text-sm text-destructive'
					>
						{errors.title.message}
					</p>
				)}
			</div>

			{/* Description */}
			<div className='space-y-2'>
				<Label htmlFor='description'>Description</Label>
				<Textarea
					id='description'
					{...register('description')}
					placeholder='Briefly describe the purpose of the meeting...'
					rows={3}
					disabled={isPending}
				/>
				{errors.description && (
					<p className='text-sm text-destructive'>
						{errors.description.message}
					</p>
				)}
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
				{/* Appointment Type */}
				<div className='space-y-2'>
					<Label htmlFor='type'>Appointment Type *</Label>
					<Controller
						name='type'
						control={control}
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isPending}
							>
								<SelectTrigger id='type'>
									<SelectValue placeholder='Select type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='CONFESSION'>
										Confession
									</SelectItem>
									<SelectItem value='COUNSELING'>
										Counseling
									</SelectItem>
									<SelectItem value='MEETING'>
										Meeting with Parish Priest
									</SelectItem>
									<SelectItem value='OTHER'>Other</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
					{errors.type && (
						<p className='text-sm text-destructive'>
							{errors.type.message}
						</p>
					)}
				</div>

				{/* Parishioner Selection */}
				<div className='space-y-2'>
					<Label htmlFor='parishionerId'>Parishioner *</Label>
					<Controller
						name='parishionerId'
						control={control}
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isPending || isLoadingParishioners}
							>
								<SelectTrigger id='parishionerId'>
									<SelectValue
										placeholder={
											isLoadingParishioners
												? 'Loading...'
												: 'Select parishioner'
										}
									/>
								</SelectTrigger>
								<SelectContent>
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
					{errors.parishionerId && (
						<p className='text-sm text-destructive'>
							{errors.parishionerId.message}
						</p>
					)}
				</div>
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
				{/* Start Time */}
				<div className='space-y-2'>
					<Label htmlFor='startTime'>Start Date & Time *</Label>
					<Input
						id='startTime'
						type='datetime-local'
						{...register('startTime')}
						disabled={isPending}
						aria-invalid={!!errors.startTime}
					/>
					{errors.startTime && (
						<p className='text-sm text-destructive'>
							{errors.startTime.message}
						</p>
					)}
				</div>

				{/* End Time */}
				<div className='space-y-2'>
					<Label htmlFor='endTime'>End Date & Time *</Label>
					<Input
						id='endTime'
						type='datetime-local'
						{...register('endTime')}
						disabled={isPending}
						aria-invalid={!!errors.endTime}
					/>
					{errors.endTime && (
						<p className='text-sm text-destructive'>
							{errors.endTime.message}
						</p>
					)}
				</div>
			</div>

			{/* Assigned To - Optional for now */}
			<div className='space-y-2'>
				<Label htmlFor='assignedToId'>
					Assign To (Optional - Staff Member ID)
				</Label>
				<Input
					id='assignedToId'
					{...register('assignedToId')}
					placeholder='Leave empty for unassigned'
					disabled={isPending}
				/>
				{errors.assignedToId && (
					<p className='text-sm text-destructive'>
						{errors.assignedToId.message}
					</p>
				)}
			</div>

			{/* Notes */}
			<div className='space-y-2'>
				<Label htmlFor='notes'>Additional Notes</Label>
				<Textarea
					id='notes'
					{...register('notes')}
					placeholder='Any special requirements or notes...'
					rows={2}
					disabled={isPending}
				/>
				{errors.notes && (
					<p className='text-sm text-destructive'>
						{errors.notes.message}
					</p>
				)}
			</div>

			<div className='flex justify-end gap-3 pt-4 border-t border-border'>
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
					{isPending ? 'Scheduling...' : 'Schedule Appointment'}
				</Button>
			</div>
		</form>
	);
}
