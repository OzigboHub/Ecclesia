'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators/auth.schema';
import { login } from '@/app/actions/auth.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = form;

	const onSubmit = (data: LoginInput) => {
		startTransition(async () => {
			const result = await login(data);

			if (result.success) {
				toast.success('Welcome back!');
				router.push('/dashboard');
				router.refresh();
			} else {
				toast.error(result.message ?? 'Invalid email or password');
			}
		});
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4'>
			<div className='w-full max-w-md'>
				{/* Logo/Branding */}
				<div className='text-center mb-8'>
					<h1 className='text-4xl font-bold text-primary mb-2'>
						Ecclesia
					</h1>
					<p className='text-muted-foreground'>
						Digital Parish Manager
					</p>
				</div>

				{/* Login Card */}
				<div className='bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-2xl p-8'>
					<h2 className='text-2xl font-semibold mb-6 text-center'>
						Welcome Back
					</h2>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className='space-y-5'
					>
						<div className='space-y-2'>
							<label
								htmlFor='email'
								className='text-sm font-medium'
							>
								Email
							</label>
							<Input
								id='email'
								type='email'
								placeholder='your.email@example.com'
								{...register('email')}
								disabled={isPending}
								autoComplete='email'
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

						<div className='space-y-2'>
							<label
								htmlFor='password'
								className='text-sm font-medium'
							>
								Password
							</label>
							<Input
								id='password'
								type='password'
								placeholder='••••••••'
								{...register('password')}
								disabled={isPending}
								autoComplete='current-password'
								aria-invalid={!!errors.password}
								aria-describedby={
									errors.password
										? 'password-error'
										: undefined
								}
							/>
							{errors.password && (
								<p
									id='password-error'
									className='text-sm text-destructive'
								>
									{errors.password.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							className='w-full'
							size='lg'
							disabled={isPending}
						>
							{isPending ? 'Signing in...' : 'Sign In'}
						</Button>
					</form>

					<div className='mt-6 text-center text-sm text-muted-foreground'>
						<p>Need help? Contact your parish administrator.</p>
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
