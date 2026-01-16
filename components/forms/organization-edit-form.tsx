'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	updateOrganizationSchema,
	type UpdateOrganizationInput,
} from '@/lib/validators/organization.schema';
import { updateOrganizationAdminAction } from '@/app/actions/organization.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organization } from '@prisma/client';

interface OrganizationEditFormProps {
	organization: Organization;
}

export function OrganizationEditForm({
	organization,
}: OrganizationEditFormProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<UpdateOrganizationInput>({
		resolver: zodResolver(updateOrganizationSchema),
		defaultValues: {
			name: organization.name,
			address: organization.address ?? '',
			contactEmail: organization.contactEmail ?? '',
			contactPhone: organization.contactPhone ?? '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = form;

	const onSubmit = (data: UpdateOrganizationInput) => {
		startTransition(async () => {
			const result = await updateOrganizationAdminAction(
				organization.id,
				data
			);

			if (result.success) {
				toast.success(result.message);
				router.refresh();
				router.push(
					`/dashboard/admin/organizations/${organization.id}`
				);
			} else {
				toast.error(result.message);
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							setError(field as keyof UpdateOrganizationInput, {
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
		<Card className='max-w-2xl'>
			<CardHeader>
				<CardTitle>Organization Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-4'
				>
					{/* Name */}
					<div className='space-y-2'>
						<Label htmlFor='name'>Organization Name *</Label>
						<Input
							id='name'
							{...register('name')}
							placeholder='Enter organization name'
							disabled={isPending}
							aria-invalid={!!errors.name}
						/>
						{errors.name && (
							<p className='text-sm text-destructive'>
								{errors.name.message}
							</p>
						)}
					</div>

					{/* Address */}
					<div className='space-y-2'>
						<Label htmlFor='address'>Address</Label>
						<Input
							id='address'
							{...register('address')}
							placeholder='Enter physical address'
							disabled={isPending}
						/>
						{errors.address && (
							<p className='text-sm text-destructive'>
								{errors.address.message}
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
							placeholder='Enter contact email'
							disabled={isPending}
						/>
						{errors.contactEmail && (
							<p className='text-sm text-destructive'>
								{errors.contactEmail.message}
							</p>
						)}
					</div>

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

					{/* Buttons */}
					<div className='flex justify-end gap-3 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => {
								router.back();
							}}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={isPending}
						>
							{isPending ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
