'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	createUserSchema,
	type CreateUserInput,
	userRoles,
	roleLabels,
	roleDescriptions,
} from '@/lib/validators/user.schema';
import { createUser } from '@/app/actions/user.actions';
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
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Info } from 'lucide-react';
import { useState } from 'react';
// Tooltip imports removed - not currently used

interface UserFormProps {
	onSuccess?: () => void;
	currentUserRole?: string;
}

export function UserForm({
	onSuccess,
	currentUserRole = 'PARISH_ADMIN',
}: UserFormProps) {
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();

	const form = useForm<CreateUserInput>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			password: '',
			role: undefined,
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		reset,
		setValue,
		watch,
	} = form;

	// Filter roles based on current user's role
	const availableRoles = userRoles.filter((role) => {
		const roleHierarchy: Record<string, number> = {
			SUPER_ADMIN: 100,
			PARISH_ADMIN: 80,
			PARISH_SECRETARY: 60,
			PARISH_STAFF: 40,
			OUTSTATION_ADMIN: 40,
			ORGANIZATION_PRESIDENT: 30,
			ORGANIZATION_SECRETARY: 30,
			PARISHIONER: 10,
		};
		const currentLevel = roleHierarchy[currentUserRole] ?? 0;
		const targetLevel = roleHierarchy[role] ?? 0;
		return currentLevel > targetLevel;
	});

	const onSubmit = (data: CreateUserInput) => {
		startTransition(async () => {
			const result = await createUser(data);

			if (result.success) {
				toast.success(result.message);
				reset();
				router.push('/dashboard/users');
				router.refresh();
				onSuccess?.();
			} else {
				toast.error(result.message);

				// Set server-side validation errors on fields
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							setError(field as keyof CreateUserInput, {
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
			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
					<CardDescription>
						Enter the user&apos;s personal details
					</CardDescription>
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
									role='alert'
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
									role='alert'
								>
									{errors.lastName.message}
								</p>
							)}
						</div>
					</div>

					{/* Email */}
					<div className='space-y-2'>
						<Label htmlFor='email'>Email Address *</Label>
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
								role='alert'
							>
								{errors.email.message}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Security */}
			<Card>
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>
						Set a secure password for the user
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Password */}
					<div className='space-y-2'>
						<Label htmlFor='password'>Password *</Label>
						<div className='relative'>
							<Input
								id='password'
								type={showPassword ? 'text' : 'password'}
								{...register('password')}
								placeholder='Enter password'
								disabled={isPending}
								aria-invalid={!!errors.password}
								aria-describedby={
									errors.password
										? 'password-error'
										: 'password-hint'
								}
								className='pr-10'
							/>
							<button
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
								tabIndex={-1}
							>
								{showPassword ? (
									<EyeOff className='h-4 w-4' />
								) : (
									<Eye className='h-4 w-4' />
								)}
							</button>
						</div>
						{errors.password ? (
							<p
								id='password-error'
								className='text-sm text-destructive'
								role='alert'
							>
								{errors.password.message}
							</p>
						) : (
							<p
								id='password-hint'
								className='text-sm text-muted-foreground'
							>
								Must be at least 8 characters with uppercase,
								number, and special character
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Role Assignment */}
			<Card>
				<CardHeader>
					<CardTitle>Role Assignment</CardTitle>
					<CardDescription>
						Assign a role to define user permissions
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Role */}
					<div className='space-y-2'>
						<Label htmlFor='role'>Role *</Label>
						<Select
							value={watch('role')}
							onValueChange={(value) =>
								setValue(
									'role',
									value as CreateUserInput['role'],
									{
										shouldValidate: true,
									}
								)
							}
							disabled={isPending}
						>
							<SelectTrigger
								id='role'
								aria-invalid={!!errors.role}
								aria-describedby={
									errors.role ? 'role-error' : undefined
								}
							>
								<SelectValue placeholder='Select a role' />
							</SelectTrigger>
							<SelectContent>
								{availableRoles.map((role) => (
									<SelectItem
										key={role}
										value={role}
									>
										<div className='flex items-center gap-2'>
											<span>{roleLabels[role]}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.role && (
							<p
								id='role-error'
								className='text-sm text-destructive'
								role='alert'
							>
								{errors.role.message}
							</p>
						)}
					</div>

					{/* Role Description */}
					{watch('role') && (
						<div className='rounded-lg border bg-muted/50 p-4'>
							<div className='flex items-start gap-3'>
								<Info className='h-5 w-5 text-primary mt-0.5' />
								<div>
									<p className='font-medium'>
										{
											roleLabels[
												watch(
													'role'
												) as keyof typeof roleLabels
											]
										}
									</p>
									<p className='text-sm text-muted-foreground mt-1'>
										{
											roleDescriptions[
												watch(
													'role'
												) as keyof typeof roleDescriptions
											]
										}
									</p>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Form Actions */}
			<div className='flex justify-end gap-3'>
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
					{isPending ? (
						<>
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							Creating...
						</>
					) : (
						'Create User'
					)}
				</Button>
			</div>
		</form>
	);
}
