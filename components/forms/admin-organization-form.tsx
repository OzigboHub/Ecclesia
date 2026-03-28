'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    createParishSchema,
    createOutstationSchema,
    type CreateParishInput,
    type CreateOutstationInput,
} from '@/lib/validators/organization.schema';
import {
    createParish,
    createOutstation,
} from '@/app/actions/organization.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FieldError } from 'react-hook-form';

interface AdminOrganizationFormProps {
	type: 'parish' | 'outstation';
	parishes?: Array<{ id: string; name: string }>;
	defaultParentId?: string;
	onSuccess?: () => void;
}

interface FormErrors {
	name?: FieldError;
	address?: FieldError;
	contactEmail?: FieldError;
	contactPhone?: FieldError;
	parentId?: FieldError;
	parishAdmin?: {
		firstName?: FieldError;
		lastName?: FieldError;
		email?: FieldError;
		password?: FieldError;
	};
}

export function AdminOrganizationForm({
	type,
	parishes = [],
	defaultParentId,
	onSuccess,
}: AdminOrganizationFormProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const isParish = type === 'parish';
	const schema = isParish ? createParishSchema : createOutstationSchema;

	const form = useForm<any>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: '',
			address: '',
			contactEmail: '',
			contactPhone: '',
			...(type === 'parish' && {
				parishAdmin: {
					firstName: '',
					lastName: '',
					email: '',
					password: '',
				},
			}),
			...(type === 'outstation' && { parentId: defaultParentId || '' }),
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = form as any;

	const formErrors = errors as FormErrors;

	const onSubmit = (data: any) => {
		startTransition(async () => {
			const result = isParish
				? await createParish(data as CreateParishInput)
				: await createOutstation(data as CreateOutstationInput);

			if (result.success) {
				toast.success(result.message);
				form.reset();
				router.refresh();
				router.push('/dashboard/admin/organizations');
				onSuccess?.();
			} else {
				toast.error(result.message);
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							const msg = Array.isArray(messages) ? messages[0] : String(messages);
							setError(field as any, {
								type: 'server',
								message: msg,
							});
						}
					);
				}
			}
		});
	};

	return (
		<Card className='w-full max-w-2xl'>
			<CardHeader>
				<CardTitle>
					Create New {isParish ? 'Parish' : 'Outstation'}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-4'
				>
					{/* Name */}
					<div className='space-y-2'>
						<Label htmlFor='name'>
							{isParish ? 'Parish' : 'Outstation'} Name *
						</Label>
						<Input
							id='name'
							{...register('name')}
							placeholder={`Enter ${
								isParish ? 'parish' : 'outstation'
							} name`}
							disabled={isPending}
							aria-invalid={!!errors.name}
							aria-describedby={
								errors.name ? 'name-error' : undefined
							}
						/>
						{formErrors.name && (
							<p
								id='name-error'
								className='text-sm text-destructive'
							>
								{formErrors.name.message}
							</p>
						)}
					</div>

					{/* Parent Parish (for outstations) */}
				{type === 'outstation' && (
					<div className='space-y-2'>
						<Label htmlFor='parentId'>Parent Parish *</Label>
						{defaultParentId ? (
							<div className='flex items-center justify-between rounded-md border px-3 py-2 bg-muted'>
								<span className='text-sm'>
									{parishes.find((p) => p.id === defaultParentId)?.name || 'Selected Parish'}
								</span>
								<span className='text-xs text-muted-foreground'>(Pre-selected)</span>
							</div>
						) : (
							<Select
								value={form.watch('parentId')}
								onValueChange={(value) =>
									form.setValue('parentId', value)
								}
								disabled={isPending}
							>
								<SelectTrigger
									aria-invalid={!!formErrors.parentId}
									aria-describedby={
										formErrors.parentId
											? 'parentId-error'
											: undefined
									}
								>
									<SelectValue placeholder='Select a parish' />
								</SelectTrigger>
								<SelectContent>
									{parishes.map((parish) => (
										<SelectItem
											key={parish.id}
											value={parish.id}
										>
											{parish.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						{formErrors.parentId && (
							<p
								id='parentId-error'
								className='text-sm text-destructive'
							>
								{formErrors.parentId.message}
							</p>
						)}
					</div>
				)}

					{/* Address */}
					<div className='space-y-2'>
						<Label htmlFor='address'>Address</Label>
						<Input
							id='address'
							{...register('address')}
							placeholder='Enter physical address'
							disabled={isPending}
						/>
						{formErrors.address && (
							<p className='text-sm text-destructive'>
								{formErrors.address.message}
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
						{formErrors.contactEmail && (
							<p className='text-sm text-destructive'>
								{formErrors.contactEmail.message}
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
						{formErrors.contactPhone && (
							<p className='text-sm text-destructive'>
								{formErrors.contactPhone.message}
							</p>
						)}
					</div>

					{/* Parish Admin (parish only) */}
					{type === 'parish' && (
						<>
							<div className='border-t pt-4 mt-4'>
								<h3 className='text-sm font-medium mb-3'>Parish Admin (default administrator)</h3>
								<p className='text-xs text-muted-foreground mb-3'>
									This user will have full access to manage the parish and its outstations.
								</p>
							</div>
							<div className='grid gap-4 sm:grid-cols-2'>
								<div className='space-y-2'>
									<Label htmlFor='parishAdmin.firstName'>First Name *</Label>
									<Input
										id='parishAdmin.firstName'
										{...register('parishAdmin.firstName')}
										placeholder='Admin first name'
										disabled={isPending}
										aria-invalid={!!formErrors.parishAdmin?.firstName}
									/>
									{formErrors.parishAdmin?.firstName && (
										<p className='text-sm text-destructive'>
											{formErrors.parishAdmin.firstName.message}
										</p>
									)}
								</div>
								<div className='space-y-2'>
									<Label htmlFor='parishAdmin.lastName'>Last Name *</Label>
									<Input
										id='parishAdmin.lastName'
										{...register('parishAdmin.lastName')}
										placeholder='Admin last name'
										disabled={isPending}
										aria-invalid={!!formErrors.parishAdmin?.lastName}
									/>
									{formErrors.parishAdmin?.lastName && (
										<p className='text-sm text-destructive'>
											{formErrors.parishAdmin.lastName.message}
										</p>
									)}
								</div>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='parishAdmin.email'>Parish Admin Email *</Label>
								<Input
									id='parishAdmin.email'
									type='email'
									{...register('parishAdmin.email')}
									placeholder='admin@parish.example.com'
									disabled={isPending}
									aria-invalid={!!formErrors.parishAdmin?.email}
								/>
								{formErrors.parishAdmin?.email && (
									<p className='text-sm text-destructive'>
										{formErrors.parishAdmin.email.message}
									</p>
								)}
							</div>
							<div className='space-y-2'>
								<Label htmlFor='parishAdmin.password'>Parish Admin Password *</Label>
								<Input
									id='parishAdmin.password'
									type='password'
									{...register('parishAdmin.password')}
									placeholder='Min 8 chars, uppercase, number, special character'
									disabled={isPending}
									aria-invalid={!!formErrors.parishAdmin?.password}
								/>
								{formErrors.parishAdmin?.password && (
									<p className='text-sm text-destructive'>
										{formErrors.parishAdmin.password.message}
									</p>
								)}
							</div>
						</>
					)}

					{/* Buttons */}
					<div className='flex justify-end gap-3 pt-4'>
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
							{isPending
								? `Creating ${
										isParish ? 'Parish' : 'Outstation'
								  }...`
								: `Create ${
										isParish ? 'Parish' : 'Outstation'
								  }`}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
