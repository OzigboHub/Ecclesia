'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	changePasswordSchema,
	type ChangePasswordInput,
} from '@/lib/validators/user.schema';
import { changeUserPassword } from '@/app/actions/user.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState } from 'react';

interface ChangePasswordFormProps {
	userId: string;
	userName: string;
	onSuccess?: () => void;
}

export function ChangePasswordForm({
	userId,
	userName,
	onSuccess,
}: ChangePasswordFormProps) {
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const form = useForm<ChangePasswordInput>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			newPassword: '',
			confirmPassword: '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		reset,
	} = form;

	const onSubmit = (data: ChangePasswordInput) => {
		startTransition(async () => {
			const result = await changeUserPassword(userId, data);

			if (result.success) {
				toast.success(result.message);
				reset();
				onSuccess?.();
			} else {
				toast.error(result.message);

				// Set server-side validation errors on fields
				if (result.errors) {
					Object.entries(result.errors).forEach(
						([field, messages]) => {
							setError(field as keyof ChangePasswordInput, {
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
			<Card>
				<CardHeader>
					<div className='flex items-center gap-3'>
						<div className='rounded-full bg-primary/10 p-2'>
							<KeyRound className='h-5 w-5 text-primary' />
						</div>
						<div>
							<CardTitle>Change Password</CardTitle>
							<CardDescription>
								Set a new password for {userName}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* New Password */}
					<div className='space-y-2'>
						<Label htmlFor='newPassword'>New Password *</Label>
						<div className='relative'>
							<Input
								id='newPassword'
								type={showPassword ? 'text' : 'password'}
								{...register('newPassword')}
								placeholder='Enter new password'
								disabled={isPending}
								aria-invalid={!!errors.newPassword}
								aria-describedby={
									errors.newPassword
										? 'newPassword-error'
										: 'newPassword-hint'
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
						{errors.newPassword ? (
							<p
								id='newPassword-error'
								className='text-sm text-destructive'
								role='alert'
							>
								{errors.newPassword.message}
							</p>
						) : (
							<p
								id='newPassword-hint'
								className='text-sm text-muted-foreground'
							>
								Must be at least 8 characters with uppercase,
								number, and special character
							</p>
						)}
					</div>

					{/* Confirm Password */}
					<div className='space-y-2'>
						<Label htmlFor='confirmPassword'>
							Confirm Password *
						</Label>
						<div className='relative'>
							<Input
								id='confirmPassword'
								type={showConfirmPassword ? 'text' : 'password'}
								{...register('confirmPassword')}
								placeholder='Confirm new password'
								disabled={isPending}
								aria-invalid={!!errors.confirmPassword}
								aria-describedby={
									errors.confirmPassword
										? 'confirmPassword-error'
										: undefined
								}
								className='pr-10'
							/>
							<button
								type='button'
								onClick={() =>
									setShowConfirmPassword(!showConfirmPassword)
								}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
								tabIndex={-1}
							>
								{showConfirmPassword ? (
									<EyeOff className='h-4 w-4' />
								) : (
									<Eye className='h-4 w-4' />
								)}
							</button>
						</div>
						{errors.confirmPassword && (
							<p
								id='confirmPassword-error'
								className='text-sm text-destructive'
								role='alert'
							>
								{errors.confirmPassword.message}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Form Actions */}
			<div className='flex justify-end gap-3'>
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
					{isPending ? (
						<>
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							Changing Password...
						</>
					) : (
						'Change Password'
					)}
				</Button>
			</div>
		</form>
	);
}
