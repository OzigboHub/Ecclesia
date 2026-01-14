'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createPiousOrganizationSchema,
	type CreatePiousOrganizationInput,
} from '@/lib/validators/pious-organization.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PiousOrganizationFormProps {
	initialData?: CreatePiousOrganizationInput;
	onSubmit: (data: CreatePiousOrganizationInput) => void;
	isLoading?: boolean;
}

export function PiousOrganizationForm({
	initialData,
	onSubmit,
	isLoading,
}: PiousOrganizationFormProps) {
	const form = useForm<CreatePiousOrganizationInput>({
		resolver: zodResolver(createPiousOrganizationSchema),
		defaultValues: {
			name: initialData?.name || '',
			description: initialData?.description || '',
			presidentName: initialData?.presidentName || '',
			secretaryName: initialData?.secretaryName || '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = form;

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-4'
		>
			{/* Organization Name */}
			<div className='space-y-2'>
				<Label htmlFor='name'>Organization Name *</Label>
				<Input
					id='name'
					{...register('name')}
					placeholder='e.g. Catholic Women Organization (CWO)'
					disabled={isLoading}
					aria-invalid={!!errors.name}
					aria-describedby={errors.name ? 'name-error' : undefined}
				/>
				{errors.name && (
					<p
						id='name-error'
						className='text-sm text-destructive'
					>
						{errors.name.message}
					</p>
				)}
			</div>

			{/* Description */}
			<div className='space-y-2'>
				<Label htmlFor='description'>Description (Optional)</Label>
				<Textarea
					id='description'
					{...register('description')}
					placeholder="Describe the organization's purpose and activities..."
					rows={4}
					disabled={isLoading}
				/>
				{errors.description && (
					<p className='text-sm text-destructive'>
						{errors.description.message}
					</p>
				)}
			</div>

			{/* Leaders */}
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<Label htmlFor='presidentName'>
						President Name (Optional)
					</Label>
					<Input
						id='presidentName'
						{...register('presidentName')}
						placeholder='Current leader'
						disabled={isLoading}
					/>
					{errors.presidentName && (
						<p className='text-sm text-destructive'>
							{errors.presidentName.message}
						</p>
					)}
				</div>

				<div className='space-y-2'>
					<Label htmlFor='secretaryName'>
						Secretary Name (Optional)
					</Label>
					<Input
						id='secretaryName'
						{...register('secretaryName')}
						placeholder='Administrative lead'
						disabled={isLoading}
					/>
					{errors.secretaryName && (
						<p className='text-sm text-destructive'>
							{errors.secretaryName.message}
						</p>
					)}
				</div>
			</div>

			{/* Submit Button */}
			<div className='flex justify-end gap-3 pt-4 border-t'>
				<Button
					type='button'
					variant='outline'
					onClick={() => reset()}
					disabled={isLoading}
				>
					Reset
				</Button>
				<Button
					type='submit'
					disabled={isLoading}
				>
					{isLoading
						? 'Saving...'
						: initialData
						? 'Update Organization'
						: 'Create Organization'}
				</Button>
			</div>
		</form>
	);
}
