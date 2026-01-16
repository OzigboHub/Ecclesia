'use client';

import { useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createMassIntentionSchema,
	type CreateMassIntentionInput,
} from '@/lib/validators/mass-intention.schema';
import { createMassIntention } from '@/app/actions/mass-intention.actions';
import { getParishioners } from '@/app/actions/parishioner.actions';
import { getMasses } from '@/app/actions/mass.actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

interface MassIntentionFormProps {
	onSuccess?: () => void;
	defaultValues?: {
		massDate?: Date;
		timeSlot?: string;
	};
}

type Parishioner = {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
};

export function MassIntentionForm({
	onSuccess,
	defaultValues: calendarDefaults,
}: MassIntentionFormProps) {
	const [isPending, startTransition] = useTransition();
	const [parishioners, setParishioners] = useState<Parishioner[]>([]);
	const [isLoadingParishioners, setIsLoadingParishioners] = useState(true);
	const [availableMasses, setAvailableMasses] = useState<any[]>([]);
	const [isLoadingMasses, setIsLoadingMasses] = useState(false);
	const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
	const router = useRouter();

	// Format date with time slot if provided from calendar
	const getInitialDate = () => {
		if (calendarDefaults?.massDate && calendarDefaults?.timeSlot) {
			const date = new Date(calendarDefaults.massDate);
			const [hours, minutes] = calendarDefaults.timeSlot.split(':');
			date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
			return date.toISOString();
		}
		return new Date().toISOString();
	};

	const form = useForm<CreateMassIntentionInput>({
		resolver: zodResolver(createMassIntentionSchema),
		defaultValues: {
			intention: '',
			intentionType: 'THANKSGIVING',
			requestedBy: '',
			contactEmail: '',
			contactPhone: '',
			massId: '',
			stipend: undefined,
			parishionerId: '',
			notes: calendarDefaults?.timeSlot
				? `Booked for ${calendarDefaults.timeSlot} mass`
				: '',
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

	// Load parishioners on mount
	useEffect(() => {
		async function loadParishioners() {
			setIsLoadingParishioners(true);
			const result = await getParishioners();
			if (result.success && result.data) {
				setParishioners(result.data);
			}
			setIsLoadingParishioners(false);
		}
		loadParishioners();
	}, []);

	// Load available masses when date changes
	useEffect(() => {
		async function loadMasses() {
			setIsLoadingMasses(true);
			form.setValue('massId', ''); // Reset mass selection when date changes
			const result = await getMasses(selectedDate);
			if (result.success && result.data) {
				setAvailableMasses(result.data.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'RESCHEDULED'));
			}
			setIsLoadingMasses(false);
		}
		loadMasses();
	}, [selectedDate, form]);

	const onSubmit = (data: CreateMassIntentionInput) => {
		startTransition(async () => {
			const result = await createMassIntention(data);

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
							setError(field as keyof CreateMassIntentionInput, {
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
			{/* Intention Details */}
			<div className='space-y-2'>
				<Label htmlFor='intention'>Intention Details *</Label>
				<Textarea
					id='intention'
					{...register('intention')}
					placeholder='E.g. For the soul of... / In thanksgiving for...'
					disabled={isPending}
					className='min-h-25'
					aria-invalid={!!errors.intention}
					aria-describedby={
						errors.intention ? 'intention-error' : undefined
					}
				/>
				{errors.intention && (
					<p
						id='intention-error'
						className='text-sm text-destructive'
					>
						{errors.intention.message}
					</p>
				)}
			</div>

			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				{/* Intention Type */}
				<div className='space-y-2'>
					<Label htmlFor='intentionType'>Intention Type *</Label>
					<Controller
						name='intentionType'
						control={control}
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isPending}
							>
								<SelectTrigger id='intentionType'>
									<SelectValue placeholder='Select type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='THANKSGIVING'>
										Thanksgiving
									</SelectItem>
									<SelectItem value='REQUIEM'>
										Requiem (For the Dead)
									</SelectItem>
									<SelectItem value='SPECIAL_INTENTION'>
										Special Intention
									</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
					{errors.intentionType && (
						<p className='text-sm text-destructive'>
							{errors.intentionType.message}
						</p>
					)}
				</div>

				{/* Requested By */}
				<div className='space-y-2'>
					<Label htmlFor='requestedBy'>Requested By *</Label>
					<Input
						id='requestedBy'
						{...register('requestedBy')}
						placeholder='Name of requester'
						disabled={isPending}
						aria-invalid={!!errors.requestedBy}
						aria-describedby={
							errors.requestedBy ? 'requestedBy-error' : undefined
						}
					/>
					{errors.requestedBy && (
						<p
							id='requestedBy-error'
							className='text-sm text-destructive'
						>
							{errors.requestedBy.message}
						</p>
					)}
				</div>
			</div>

			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				{/* Mass Date Filter */}
				<div className='space-y-2'>
					<Label htmlFor='massDate'>Preferred Date *</Label>
					<Input
						id='massDate'
						type='date'
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						disabled={isPending}
					/>
				</div>

				{/* Mass Selection */}
				<div className='space-y-2'>
					<Label htmlFor='massId'>Select Mass *</Label>
					<Controller
						name='massId'
						control={control}
						render={({ field }) => (
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={isPending || isLoadingMasses}
							>
								<SelectTrigger id='massId'>
									<SelectValue
										placeholder={
											isLoadingMasses
												? 'Loading masses...'
												: availableMasses.length === 0
													? 'No masses available'
													: 'Select a mass'
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{availableMasses.map((mass) => (
										<SelectItem
											key={mass.id}
											value={mass.id}
										>
											{mass.time} - {mass.massType.replace('_', ' ')}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.massId && (
						<p className='text-sm text-destructive'>
							{errors.massId.message}
						</p>
					)}
				</div>

				{/* Stipend */}
				<div className='space-y-2'>
					<Label htmlFor='stipend'>
						Stipend Amount (Optional) — Auto-creates Payment
					</Label>
					<p className='text-xs text-muted-foreground'>
						If provided, a payment record will be automatically
						created and linked to this intention
					</p>
					<div className='relative'>
						<span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
							₦
						</span>
						<Input
							id='stipend'
							type='number'
							step='0.01'
							min='0'
							{...register('stipend', { valueAsNumber: true })}
							className='pl-8'
							placeholder='0.00'
							disabled={isPending}
							aria-describedby='stipend-helper'
						/>
					</div>
					<p
						id='stipend-helper'
						className='text-xs text-muted-foreground'
					>
						Payment will be recorded with receipt number
						automatically.
					</p>
					{errors.stipend && (
						<p className='text-sm text-destructive'>
							{errors.stipend.message}
						</p>
					)}
				</div>
			</div>

			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				{/* Contact Phone */}
				<div className='space-y-2'>
					<Label htmlFor='contactPhone'>Contact Phone</Label>
					<Input
						id='contactPhone'
						type='tel'
						{...register('contactPhone')}
						placeholder='e.g., 08012345678'
						disabled={isPending}
					/>
					{errors.contactPhone && (
						<p className='text-sm text-destructive'>
							{errors.contactPhone.message}
						</p>
					)}
				</div>

				{/* Contact Email */}
				<div className='space-y-2'>
					<Label htmlFor='contactEmail'>Contact Email</Label>
					<Input
						id='contactEmail'
						type='email'
						{...register('contactEmail')}
						placeholder='email@example.com'
						disabled={isPending}
					/>
					{errors.contactEmail && (
						<p className='text-sm text-destructive'>
							{errors.contactEmail.message}
						</p>
					)}
				</div>
			</div>

			{/* Parishioner Selection (Optional) */}
			<div className='space-y-2'>
				<Label htmlFor='parishionerId'>
					Link to Parishioner (Optional)
				</Label>
				<Controller
					name='parishionerId'
					control={control}
					render={({ field }) => (
						<Select
							value={field.value || 'none'}
							onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
							disabled={isPending || isLoadingParishioners}
						>
							<SelectTrigger id='parishionerId'>
								<SelectValue
									placeholder={
										isLoadingParishioners
											? 'Loading parishioners...'
											: 'Select parishioner (optional)'
									}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='none'>None</SelectItem>
								{parishioners.map((parishioner) => (
									<SelectItem
										key={parishioner.id}
										value={parishioner.id}
									>
										{parishioner.firstName}{' '}
										{parishioner.lastName}
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

			{/* Notes */}
			<div className='space-y-2'>
				<Label htmlFor='notes'>Additional Notes</Label>
				<Textarea
					id='notes'
					{...register('notes')}
					placeholder='Any additional information...'
					disabled={isPending}
					rows={3}
				/>
				{errors.notes && (
					<p className='text-sm text-destructive'>
						{errors.notes.message}
					</p>
				)}
			</div>

			{/* Submit Buttons */}
			<div className='flex justify-end gap-3 border-t border-border pt-4'>
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
					{isPending ? 'Booking...' : 'Book Intention'}
				</Button>
			</div>
		</form>
	);
}
