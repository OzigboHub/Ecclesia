'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	forgotPasswordSchema,
	type ForgotPasswordInput,
} from '@/lib/validators/auth.schema';
import { requestPasswordReset } from '@/app/actions/auth.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
	const [isPending, startTransition] = useTransition();
	const [emailSent, setEmailSent] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState('');

	const form = useForm<ForgotPasswordInput>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = form;

	const onSubmit = (data: ForgotPasswordInput) => {
		startTransition(async () => {
			const result = await requestPasswordReset(data.email);

			if (result.success) {
				setSubmittedEmail(data.email);
				setEmailSent(true);
				toast.success('Password reset email sent');
			} else {
				// We show success even if email doesn't exist for security
				// But still set the state as if successful
				setSubmittedEmail(data.email);
				setEmailSent(true);
			}
		});
	};

	if (emailSent) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4'>
				<div className='w-full max-w-md'>
					<div className='bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8 text-center'>
						<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
							<CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
						</div>
						<h2 className='text-2xl font-semibold mb-2'>
							Check Your Email
						</h2>
						<p className='text-muted-foreground mb-6'>
							If an account exists for{' '}
							<span className='font-medium text-foreground'>
								{submittedEmail}
							</span>
							, you will receive a password reset link shortly.
						</p>
						<div className='space-y-3'>
							<Button
								asChild
								className='w-full'
							>
								<Link href='/auth/login'>
									<ArrowLeft className='mr-2 h-4 w-4' />
									Back to Login
								</Link>
							</Button>
							<Button
								variant='outline'
								className='w-full'
								onClick={() => {
									setEmailSent(false);
									form.reset();
								}}
							>
								Try Different Email
							</Button>
						</div>
						<p className='mt-6 text-xs text-muted-foreground'>
							Didn&apos;t receive the email? Check your spam
							folder or contact your parish administrator.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4'>
			<div className='w-full max-w-md'>
				{/* Back to Login */}
				<Link
					href='/auth/login'
					className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
				>
					<ArrowLeft className='mr-2 h-4 w-4' />
					Back to Login
				</Link>

				{/* Logo/Branding */}
				<div className='text-center mb-6'>
					<h1 className='text-4xl font-bold text-primary mb-2'>
						Ecclesia
					</h1>
					<p className='text-muted-foreground'>
						Digital Parish Manager
					</p>
				</div>

				{/* Forgot Password Card */}
				<div className='bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8'>
					<div className='text-center mb-6'>
						<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
							<Mail className='h-6 w-6 text-primary' />
						</div>
						<h2 className='text-2xl font-semibold'>
							Forgot Password?
						</h2>
						<p className='text-muted-foreground mt-2'>
							Enter your email address and we&apos;ll send you a
							link to reset your password.
						</p>
					</div>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className='space-y-4'
					>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email Address</Label>
							<Input
								id='email'
								type='email'
								{...register('email')}
								placeholder='your.email@example.com'
								disabled={isPending}
								autoComplete='email'
								aria-invalid={!!errors.email}
							/>
							{errors.email && (
								<p className='text-xs text-destructive'>
									{errors.email.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							className='w-full'
							size='lg'
							disabled={isPending}
						>
							{isPending ? 'Sending...' : 'Send Reset Link'}
						</Button>
					</form>

					<div className='mt-6 text-center text-sm'>
						<p className='text-muted-foreground'>
							Remember your password?{' '}
							<Link
								href='/auth/login'
								className='text-primary hover:underline font-medium'
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className='mt-6 text-center text-xs text-muted-foreground'>
					<p>© 2026 Ecclesia DPM. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}
