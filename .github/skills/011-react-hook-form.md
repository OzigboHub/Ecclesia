# Skill: React Hook Form with Zod

## Metadata

-   **ID**: `ecclesia.forms.react_hook_form`
-   **Version**: 1.0.0
-   **Category**: Forms
-   **Priority**: High

## Purpose

Use React Hook Form with Zod resolver for ALL forms. This provides type-safe form handling, efficient re-renders, and consistent validation patterns.

## When to Use

-   Creating any form (create, edit, filter, search)
-   Handling multi-step forms
-   Implementing form validation
-   Managing form state

## Constraints

-   **All forms must use React Hook Form** — no uncontrolled native forms
-   **Always use Zod resolver** for validation
-   **Forms are Client Components** — use `'use client'`
-   **Display errors clearly** with proper accessibility
-   **Use `useTransition`** for Server Action submissions
-   **Show loading states** during submission

## Basic Form Pattern

```tsx
// components/forms/parishioner-form.tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createParishionerSchema,
	type CreateParishionerInput,
} from '@/lib/validators/parishioner.schema';
import { createParishioner } from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ParishionerFormProps {
	onSuccess?: () => void;
}

export function ParishionerForm({ onSuccess }: ParishionerFormProps) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<CreateParishionerInput>({
		resolver: zodResolver(createParishionerSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			gender: undefined,
			maritalStatus: undefined,
			address: '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		reset,
	} = form;

	const onSubmit = (data: CreateParishionerInput) => {
		startTransition(async () => {
			const result = await createParishioner(data);

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
							setError(field as keyof CreateParishionerInput, {
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
						errors.firstName ? 'firstName-error' : undefined
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
						errors.lastName ? 'lastName-error' : undefined
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
					aria-describedby={errors.email ? 'email-error' : undefined}
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
				<Label htmlFor='phone'>Phone</Label>
				<Input
					id='phone'
					type='tel'
					{...register('phone')}
					placeholder='e.g., 08012345678'
					disabled={isPending}
				/>
				{errors.phone && (
					<p className='text-sm text-destructive'>
						{errors.phone.message}
					</p>
				)}
			</div>

			{/* Gender */}
			<div className='space-y-2'>
				<Label htmlFor='gender'>Gender *</Label>
				<Select
					id='gender'
					{...register('gender')}
					disabled={isPending}
					aria-invalid={!!errors.gender}
				>
					<option value=''>Select gender</option>
					<option value='MALE'>Male</option>
					<option value='FEMALE'>Female</option>
				</Select>
				{errors.gender && (
					<p className='text-sm text-destructive'>
						{errors.gender.message}
					</p>
				)}
			</div>

			{/* Submit Button */}
			<div className='flex justify-end gap-3 pt-4'>
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
					{isPending ? 'Creating...' : 'Create Parishioner'}
				</Button>
			</div>
		</form>
	);
}
```

## Edit Form Pattern (Pre-populated)

```tsx
// components/forms/parishioner-edit-form.tsx
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	updateParishionerSchema,
	type UpdateParishionerInput,
} from '@/lib/validators/parishioner.schema';
import { updateParishioner } from '@/app/actions/parishioner.actions';
import type { Parishioner } from '@prisma/client';

interface ParishionerEditFormProps {
	parishioner: Parishioner;
	onSuccess?: () => void;
}

export function ParishionerEditForm({
	parishioner,
	onSuccess,
}: ParishionerEditFormProps) {
	const [isPending, startTransition] = useTransition();

	const form = useForm<UpdateParishionerInput>({
		resolver: zodResolver(updateParishionerSchema),
		defaultValues: {
			firstName: parishioner.firstName,
			lastName: parishioner.lastName,
			email: parishioner.email,
			phone: parishioner.phone ?? '',
			gender: parishioner.gender,
			maritalStatus: parishioner.maritalStatus ?? undefined,
			address: parishioner.address ?? '',
		},
	});

	const onSubmit = (data: UpdateParishionerInput) => {
		startTransition(async () => {
			const result = await updateParishioner(parishioner.id, data);
			// ... handle result
		});
	};

	// ... rest of form
}
```

## Payment Form with Nigerian Naira

```tsx
// components/forms/payment-form.tsx
'use client';

import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createPaymentSchema,
	type CreatePaymentInput,
} from '@/lib/validators/payment.schema';
import { createPayment } from '@/app/actions/payment.actions';
import { toast } from 'sonner';

export function PaymentForm() {
	const [isPending, startTransition] = useTransition();

	const form = useForm<CreatePaymentInput>({
		resolver: zodResolver(createPaymentSchema),
		defaultValues: {
			amount: 0,
			purpose: undefined,
			method: undefined,
			payerName: '',
			notes: '',
		},
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		watch,
	} = form;

	const onSubmit = (data: CreatePaymentInput) => {
		startTransition(async () => {
			const result = await createPayment(data);
			if (result.success) {
				toast.success(result.message);
				form.reset();
			} else {
				toast.error(result.message);
			}
		});
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-4'
		>
			{/* Amount in Nigerian Naira */}
			<div className='space-y-2'>
				<Label htmlFor='amount'>Amount (₦) *</Label>
				<div className='relative'>
					<span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
						₦
					</span>
					<Input
						id='amount'
						type='number'
						step='0.01'
						min='0'
						{...register('amount', { valueAsNumber: true })}
						className='pl-8'
						placeholder='0.00'
						disabled={isPending}
					/>
				</div>
				{errors.amount && (
					<p className='text-sm text-destructive'>
						{errors.amount.message}
					</p>
				)}
				{/* Display formatted amount */}
				{watch('amount') > 0 && (
					<p className='text-sm text-muted-foreground'>
						{new Intl.NumberFormat('en-NG', {
							style: 'currency',
							currency: 'NGN',
						}).format(watch('amount'))}
					</p>
				)}
			</div>

			{/* Purpose */}
			<div className='space-y-2'>
				<Label htmlFor='purpose'>Purpose *</Label>
				<Select
					id='purpose'
					{...register('purpose')}
					disabled={isPending}
				>
					<option value=''>Select purpose</option>
					<option value='OFFERING'>Offering</option>
					<option value='TITHE'>Tithe</option>
					<option value='MASS_INTENTION'>Mass Intention</option>
					<option value='DONATION_CAMPAIGN'>Donation Campaign</option>
					<option value='OTHER'>Other</option>
				</Select>
				{errors.purpose && (
					<p className='text-sm text-destructive'>
						{errors.purpose.message}
					</p>
				)}
			</div>

			{/* Payment Method */}
			<div className='space-y-2'>
				<Label htmlFor='method'>Payment Method *</Label>
				<Select
					id='method'
					{...register('method')}
					disabled={isPending}
				>
					<option value=''>Select method</option>
					<option value='CASH'>Cash</option>
					<option value='BANK_TRANSFER'>Bank Transfer</option>
					<option value='CARD'>Card</option>
					<option value='MOBILE_MONEY'>Mobile Money</option>
					<option value='CHECK'>Check</option>
				</Select>
				{errors.method && (
					<p className='text-sm text-destructive'>
						{errors.method.message}
					</p>
				)}
			</div>

			<Button
				type='submit'
				disabled={isPending}
				className='w-full'
			>
				{isPending ? 'Recording Payment...' : 'Record Payment'}
			</Button>
		</form>
	);
}
```

## Form with Controlled Components

```tsx
// For complex inputs like date pickers, rich text, etc.
import { Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';

<Controller
	name='dateOfBirth'
	control={form.control}
	render={({ field }) => (
		<div className='space-y-2'>
			<Label>Date of Birth</Label>
			<DatePicker
				value={field.value}
				onChange={field.onChange}
				disabled={isPending}
			/>
			{errors.dateOfBirth && (
				<p className='text-sm text-destructive'>
					{errors.dateOfBirth.message}
				</p>
			)}
		</div>
	)}
/>;
```

## Filter/Search Form Pattern

```tsx
// components/features/payments/payment-filters.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	paymentFilterSchema,
	type PaymentFilter,
} from '@/lib/validators/payment.schema';
import { useCallback } from 'react';

export function PaymentFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const form = useForm<PaymentFilter>({
		resolver: zodResolver(paymentFilterSchema),
		defaultValues: {
			status: searchParams.get('status') ?? '',
			purpose: searchParams.get('purpose') ?? '',
			dateFrom: searchParams.get('dateFrom') ?? '',
			dateTo: searchParams.get('dateTo') ?? '',
		},
	});

	const onSubmit = useCallback(
		(data: PaymentFilter) => {
			const params = new URLSearchParams();

			Object.entries(data).forEach(([key, value]) => {
				if (value) params.set(key, value);
			});

			router.push(`?${params.toString()}`);
		},
		[router]
	);

	// Auto-submit on change
	const handleChange = () => {
		form.handleSubmit(onSubmit)();
	};

	return (
		<form className='flex flex-wrap gap-4'>
			<Select
				{...form.register('status')}
				onChange={handleChange}
			>
				<option value=''>All Statuses</option>
				<option value='PENDING'>Pending</option>
				<option value='COMPLETED'>Completed</option>
			</Select>

			<Select
				{...form.register('purpose')}
				onChange={handleChange}
			>
				<option value=''>All Purposes</option>
				<option value='OFFERING'>Offering</option>
				<option value='TITHE'>Tithe</option>
			</Select>

			<Button
				type='button'
				variant='outline'
				onClick={() => {
					form.reset();
					router.push('?');
				}}
			>
				Clear Filters
			</Button>
		</form>
	);
}
```

## Form in Modal

```tsx
// components/features/parishioners/create-parishioner-modal.tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ParishionerForm } from '@/components/forms/parishioner-form';
import { UserPlus } from 'lucide-react';

export function CreateParishionerModal() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setOpen(true)}>
				<UserPlus className='h-4 w-4 mr-2' />
				Add Parishioner
			</Button>

			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title='Add New Parishioner'
			>
				<ParishionerForm onSuccess={() => setOpen(false)} />
			</Modal>
		</>
	);
}
```

## Form Accessibility Requirements

```tsx
// Always include:
// 1. Labels with htmlFor pointing to input id
// 2. aria-invalid on inputs with errors
// 3. aria-describedby linking to error message
// 4. Error messages with matching id
// 5. Disabled state during submission

<div className='space-y-2'>
	<Label htmlFor='email'>Email *</Label>
	<Input
		id='email' // 1. Match label htmlFor
		type='email'
		{...register('email')}
		aria-invalid={!!errors.email} // 2. Indicate error state
		aria-describedby={errors.email ? 'email-error' : undefined} // 3. Link to error
		disabled={isPending} // 5. Disable during submit
	/>
	{errors.email && (
		<p
			id='email-error' // 4. Match aria-describedby
			className='text-sm text-destructive'
			role='alert'
		>
			{errors.email.message}
		</p>
	)}
</div>
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Uncontrolled form
<form onSubmit={(e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  // No type safety, no validation
}}>

// ❌ WRONG: useState for each field
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
// Causes unnecessary re-renders

// ❌ WRONG: No loading state
<Button type="submit">Submit</Button>

// ✅ CORRECT: Show loading state
<Button type="submit" disabled={isPending}>
  {isPending ? 'Submitting...' : 'Submit'}
</Button>

// ❌ WRONG: Not handling server errors
const onSubmit = async (data) => {
  await createItem(data)  // Ignoring the result!
}
```

## Testing Checklist

-   [ ] Form uses React Hook Form with zodResolver
-   [ ] All fields have accessible labels
-   [ ] Error states are visually indicated
-   [ ] Loading state shown during submission
-   [ ] Server errors displayed on relevant fields
-   [ ] Form resets or redirects on success
-   [ ] Keyboard navigation works properly

## Related Skills

-   `ecclesia.validation.zod_schemas`
-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.ui.form_accessibility`

## References

-   [React Hook Form Docs](https://react-hook-form.com)
-   [components/forms/](../../components/forms/)
-   [lib/validators/](../../lib/validators/)
