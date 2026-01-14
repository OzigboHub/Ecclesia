'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	updateParishionerSchema,
	type UpdateParishionerInput,
} from '@/lib/validators/parishioner.schema';
import { updateParishioner } from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Parishioner } from '@prisma/client';

interface ParishionerEditFormProps {
	parishioner: Parishioner;
}

export function ParishionerEditForm({ parishioner }: ParishionerEditFormProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<UpdateParishionerInput>({
		resolver: zodResolver(updateParishionerSchema),
		defaultValues: {
			firstName: parishioner.firstName,
			lastName: parishioner.lastName,
			email: parishioner.email ?? '',
			phone: parishioner.phone ?? '',
			gender: parishioner.gender ?? undefined,
			maritalStatus: parishioner.maritalStatus ?? undefined,
			dateOfBirth: parishioner.dateOfBirth
				? new Date(parishioner.dateOfBirth).toISOString().split('T')[0]
				: undefined,
			address: parishioner.address ?? '',
			occupation: parishioner.occupation ?? '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		watch,
		setValue,
	} = form;

	const onSubmit = (data: UpdateParishionerInput) => {
		startTransition(async () => {
			const result = await updateParishioner(parishioner.id, data);

			if (result.success) {
				toast.success(result.message);
				router.push(`/dashboard/parishioners/${parishioner.id}`);
				router.refresh();
			} else {
				toast.error(result.message);

				// Set server-side validation errors on fields
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							setError(field as keyof UpdateParishionerInput, {
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
			className='space-y-6'
		>
			{/* Personal Information */}
			<Card>
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2'>
						{/* First Name */}
						<div className='space-y-2'>
							<Label htmlFor='firstName'>First Name *</Label>
							<Input
								id='firstName'
								{...register('firstName')}
								placeholder='Enter first name'
								disabled={isPending}
								aria-invalid={!!errors.firstName}
								aria-describedby={
									errors.firstName
										? 'firstName-error'
										: undefined
								}
							/>
							{errors.firstName && (
								<p
									id='firstName-error'
									className='text-sm text-destructive'
								>
									{errors.firstName.message}
								</p>
							)}
						</div>

						{/* Last Name */}
						<div className='space-y-2'>
							<Label htmlFor='lastName'>Last Name *</Label>
							<Input
								id='lastName'
								{...register('lastName')}
								placeholder='Enter last name'
								disabled={isPending}
								aria-invalid={!!errors.lastName}
								aria-describedby={
									errors.lastName
										? 'lastName-error'
										: undefined
								}
							/>
							{errors.lastName && (
								<p
									id='lastName-error'
									className='text-sm text-destructive'
								>
									{errors.lastName.message}
								</p>
							)}
						</div>
					</div>

					<div className='grid gap-4 md:grid-cols-2'>
						{/* Gender */}
						<div className='space-y-2'>
							<Label htmlFor='gender'>Gender *</Label>
							<Select
								value={watch('gender') || ''}
								onValueChange={(value) =>
									setValue(
										'gender',
										value as 'MALE' | 'FEMALE',
										{ shouldValidate: true }
									)
								}
								disabled={isPending}
							>
								<SelectTrigger
									id='gender'
									aria-invalid={!!errors.gender}
								>
									<SelectValue placeholder='Select gender' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='MALE'>Male</SelectItem>
									<SelectItem value='FEMALE'>
										Female
									</SelectItem>
								</SelectContent>
							</Select>
							{errors.gender && (
								<p className='text-sm text-destructive'>
									{errors.gender.message}
								</p>
							)}
						</div>

						{/* Date of Birth */}
						<div className='space-y-2'>
							<Label htmlFor='dateOfBirth'>Date of Birth</Label>
							<Input
								id='dateOfBirth'
								type='date'
								{...register('dateOfBirth')}
								disabled={isPending}
								max={new Date().toISOString().split('T')[0]}
							/>
							{errors.dateOfBirth && (
								<p className='text-sm text-destructive'>
									{errors.dateOfBirth.message}
								</p>
							)}
						</div>
					</div>

					{/* Marital Status */}
					<div className='space-y-2'>
						<Label htmlFor='maritalStatus'>Marital Status</Label>
						<Select
							value={watch('maritalStatus') || ''}
							onValueChange={(value) =>
								setValue(
									'maritalStatus',
									value as
										| 'SINGLE'
										| 'MARRIED'
										| 'WIDOWED'
										| 'DIVORCED',
									{ shouldValidate: true }
								)
							}
							disabled={isPending}
						>
							<SelectTrigger id='maritalStatus'>
								<SelectValue placeholder='Select marital status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='SINGLE'>Single</SelectItem>
								<SelectItem value='MARRIED'>Married</SelectItem>
								<SelectItem value='WIDOWED'>Widowed</SelectItem>
								<SelectItem value='DIVORCED'>
									Divorced
								</SelectItem>
							</SelectContent>
						</Select>
						{errors.maritalStatus && (
							<p className='text-sm text-destructive'>
								{errors.maritalStatus.message}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Contact Information */}
			<Card>
				<CardHeader>
					<CardTitle>Contact Information</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Email */}
					<div className='space-y-2'>
						<Label htmlFor='email'>Email *</Label>
						<Input
							id='email'
							type='email'
							{...register('email')}
							placeholder='Enter email address'
							disabled={isPending}
							aria-invalid={!!errors.email}
							aria-describedby={
								errors.email ? 'email-error' : undefined
							}
						/>
						{errors.email && (
							<p
								id='email-error'
								className='text-sm text-destructive'
							>
								{errors.email.message}
							</p>
						)}
					</div>

					{/* Phone */}
					<div className='space-y-2'>
						<Label htmlFor='phone'>Phone Number</Label>
						<Input
							id='phone'
							type='tel'
							{...register('phone')}
							placeholder='e.g., 08012345678 or +2348012345678'
							disabled={isPending}
						/>
						{errors.phone && (
							<p className='text-sm text-destructive'>
								{errors.phone.message}
							</p>
						)}
						<p className='text-xs text-muted-foreground'>
							Enter a valid Nigerian phone number
						</p>
					</div>

					{/* Address */}
					<div className='space-y-2'>
						<Label htmlFor='address'>Address</Label>
						<Input
							id='address'
							{...register('address')}
							placeholder='Enter home address'
							disabled={isPending}
						/>
						{errors.address && (
							<p className='text-sm text-destructive'>
								{errors.address.message}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Additional Information */}
			<Card>
				<CardHeader>
					<CardTitle>Additional Information</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Occupation */}
					<div className='space-y-2'>
						<Label htmlFor='occupation'>Occupation</Label>
						<Input
							id='occupation'
							{...register('occupation')}
							placeholder='Enter occupation'
							disabled={isPending}
						/>
						{errors.occupation && (
							<p className='text-sm text-destructive'>
								{errors.occupation.message}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Submit Buttons */}
			<div className='flex justify-end gap-3 pt-4 border-t'>
				<Button
					type='button'
					variant='outline'
					onClick={() => router.back()}
					disabled={isPending}
				>
					Cancel
				</Button>
				<Button
					type='submit'
					disabled={isPending}
				>
					{isPending && (
						<Loader2 className='mr-2 h-4 w-4 animate-spin' />
					)}
					{isPending ? 'Saving...' : 'Save Changes'}
				</Button>
			</div>
		</form>
	);
}
