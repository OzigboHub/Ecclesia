'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	resetPasswordSchema,
	type ResetPasswordInput,
} from '@/lib/validators/auth.schema';
import { resetPassword, validateResetToken } from '@/app/actions/auth.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
	ArrowLeft,
	Eye,
	EyeOff,
	CheckCircle,
	XCircle,
	AlertTriangle,
	LockKeyhole,
} from 'lucide-react';

function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');

	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [resetSuccess, setResetSuccess] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<
		'loading' | 'valid' | 'invalid' | 'expired'
	>('loading');

	const form = useForm<ResetPasswordInput>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			token: token || '',
			password: '',
			confirmPassword: '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = form;

	const password = watch('password');

	// Password requirements
	const requirements = [
		{ regex: /.{8,}/, label: 'At least 8 characters' },
		{ regex: /[A-Z]/, label: 'One uppercase letter' },
		{ regex: /[a-z]/, label: 'One lowercase letter' },
		{ regex: /[0-9]/, label: 'One number' },
		{ regex: /[^A-Za-z0-9]/, label: 'One special character' },
	];

	// Validate token on mount
	useEffect(() => {
		if (!token) {
			setTokenStatus('invalid');
			return;
		}

		const checkToken = async () => {
			const result = await validateResetToken(token);
			if (result.success) {
				setTokenStatus('valid');
			} else if (result.message?.includes('expired')) {
				setTokenStatus('expired');
			} else {
				setTokenStatus('invalid');
			}
		};

		checkToken();
	}, [token]);

	const onSubmit = (data: ResetPasswordInput) => {
		startTransition(async () => {
			const result = await resetPassword(data);

			if (result.success) {
				setResetSuccess(true);
				toast.success('Password reset successfully!');
			} else {
				toast.error(result.message || 'Failed to reset password');
			}
		});
	};

	// Loading state while validating token
	if (tokenStatus === 'loading') {
		return (
			<div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4'>
				<div className='text-center'>
					<Spinner className='h-8 w-8 mx-auto mb-4' />
					<p className='text-muted-foreground'>
						Validating reset link...
					</p>
				</div>
			</div>
		);
	}

	// Invalid token state
	if (tokenStatus === 'invalid') {
		return (
			<div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4'>
				<div className='w-full max-w-md'>
					<div className='bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8 text-center'>
						<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
							<XCircle className='h-8 w-8 text-red-600 dark:text-red-400' />
						</div>
						<h2 className='text-2xl font-semibold mb-2'>
							Invalid Reset Link
						</h2>
						<p className='text-muted-foreground mb-6'>
							This password reset link is invalid or has already
							been used. Please request a new password reset.
						</p>
						<div className='space-y-3'>
							<Button
								asChild
								className='w-full'
							>
								<Link href='/auth/forgot-password'>
									Request New Reset Link
								</Link>
							</Button>
							<Button
								asChild
								variant='outline'
								className='w-full'
							>
								<Link href='/auth/login'>
									<ArrowLeft className='mr-2 h-4 w-4' />
									Back to Login
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Expired token state
	if (tokenStatus === 'expired') {
		return (
			<div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4'>
				<div className='w-full max-w-md'>
					<div className='bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8 text-center'>
						<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900'>
							<AlertTriangle className='h-8 w-8 text-yellow-600 dark:text-yellow-400' />
						</div>
						<h2 className='text-2xl font-semibold mb-2'>
							Link Expired
						</h2>
						<p className='text-muted-foreground mb-6'>
							This password reset link has expired. Reset links
							are valid for 1 hour. Please request a new one.
						</p>
						<div className='space-y-3'>
							<Button
								asChild
								className='w-full'
							>
								<Link href='/auth/forgot-password'>
									Request New Reset Link
								</Link>
							</Button>
							<Button
								asChild
								variant='outline'
								className='w-full'
							>
								<Link href='/auth/login'>
									<ArrowLeft className='mr-2 h-4 w-4' />
									Back to Login
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Success state
	if (resetSuccess) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4'>
				<div className='w-full max-w-md'>
					<div className='bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8 text-center'>
						<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
							<CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
						</div>
						<h2 className='text-2xl font-semibold mb-2'>
							Password Reset Complete!
						</h2>
						<p className='text-muted-foreground mb-6'>
							Your password has been successfully reset. You can
							now sign in with your new password.
						</p>
						<Button
							asChild
							className='w-full'
							size='lg'
						>
							<Link href='/auth/login'>
								Sign In to Your Account
							</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// Reset password form
	return (
		<div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/20 p-4'>
			<div className='w-full max-w-md'>
				{/* Logo/Branding */}
				<div className='text-center mb-6'>
					<h1 className='text-4xl font-bold text-primary mb-2'>
						Ecclesia
					</h1>
					<p className='text-muted-foreground'>
						Digital Parish Manager
					</p>
				</div>

				{/* Reset Password Card */}
				<div className='bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8'>
					<div className='text-center mb-6'>
						<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
							<LockKeyhole className='h-6 w-6 text-primary' />
						</div>
						<h2 className='text-2xl font-semibold'>
							Set New Password
						</h2>
						<p className='text-muted-foreground mt-2'>
							Create a strong password for your account.
						</p>
					</div>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className='space-y-4'
					>
						<input
							type='hidden'
							{...register('token')}
						/>

						{/* New Password */}
						<div className='space-y-2'>
							<Label htmlFor='password'>New Password</Label>
							<div className='relative'>
								<Input
									id='password'
									type={showPassword ? 'text' : 'password'}
									{...register('password')}
									placeholder='Enter new password'
									disabled={isPending}
									className='pr-10'
									aria-invalid={!!errors.password}
								/>
								<button
									type='button'
									onClick={() =>
										setShowPassword(!showPassword)
									}
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
							{errors.password && (
								<p className='text-xs text-destructive'>
									{errors.password.message}
								</p>
							)}
						</div>

						{/* Password Requirements */}
						{password && (
							<div className='bg-muted/50 rounded-md p-3 space-y-1'>
								<p className='text-xs font-medium text-muted-foreground mb-2'>
									Password Requirements:
								</p>
								{requirements.map((req, index) => {
									const isValid = req.regex.test(password);
									return (
										<div
											key={index}
											className='flex items-center gap-2 text-xs'
										>
											{isValid ? (
												<CheckCircle className='h-3.5 w-3.5 text-green-600' />
											) : (
												<XCircle className='h-3.5 w-3.5 text-muted-foreground' />
											)}
											<span
												className={
													isValid
														? 'text-green-600'
														: 'text-muted-foreground'
												}
											>
												{req.label}
											</span>
										</div>
									);
								})}
							</div>
						)}

						{/* Confirm Password */}
						<div className='space-y-2'>
							<Label htmlFor='confirmPassword'>
								Confirm New Password
							</Label>
							<div className='relative'>
								<Input
									id='confirmPassword'
									type={
										showConfirmPassword
											? 'text'
											: 'password'
									}
									{...register('confirmPassword')}
									placeholder='Confirm new password'
									disabled={isPending}
									className='pr-10'
									aria-invalid={!!errors.confirmPassword}
								/>
								<button
									type='button'
									onClick={() =>
										setShowConfirmPassword(
											!showConfirmPassword
										)
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
								<p className='text-xs text-destructive'>
									{errors.confirmPassword.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							className='w-full'
							size='lg'
							disabled={isPending}
						>
							{isPending
								? 'Resetting Password...'
								: 'Reset Password'}
						</Button>
					</form>
				</div>

				{/* Footer */}
				<div className='mt-6 text-center text-xs text-muted-foreground'>
					<p>© 2026 Ecclesia DPM. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}
export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className='flex min-h-screen items-center justify-center'>
					<Spinner />
				</div>
			}
		>
			<ResetPasswordForm />
		</Suspense>
	);
}
