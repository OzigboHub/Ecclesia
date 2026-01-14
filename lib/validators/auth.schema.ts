import { z } from 'zod';

// ============================================
// LOGIN SCHEMA
// ============================================

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'Email is required')
		.email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// REGISTER SCHEMA
// ============================================

export const registerSchema = z
	.object({
		firstName: z
			.string()
			.min(2, 'First name must be at least 2 characters')
			.max(50, 'First name must not exceed 50 characters')
			.trim(),
		lastName: z
			.string()
			.min(2, 'Last name must be at least 2 characters')
			.max(50, 'Last name must not exceed 50 characters')
			.trim(),
		email: z
			.string()
			.min(1, 'Email is required')
			.email('Invalid email address')
			.toLowerCase()
			.trim(),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/[A-Z]/,
				'Password must contain at least one uppercase letter'
			)
			.regex(
				/[a-z]/,
				'Password must contain at least one lowercase letter'
			)
			.regex(/[0-9]/, 'Password must contain at least one number')
			.regex(
				/[^A-Za-z0-9]/,
				'Password must contain at least one special character'
			),
		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// FORGOT PASSWORD SCHEMA
// ============================================

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.min(1, 'Email is required')
		.email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ============================================
// RESET PASSWORD SCHEMA
// ============================================

export const resetPasswordSchema = z
	.object({
		token: z.string().min(1, 'Reset token is required'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/[A-Z]/,
				'Password must contain at least one uppercase letter'
			)
			.regex(
				/[a-z]/,
				'Password must contain at least one lowercase letter'
			)
			.regex(/[0-9]/, 'Password must contain at least one number')
			.regex(
				/[^A-Za-z0-9]/,
				'Password must contain at least one special character'
			),
		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================
// CHANGE PASSWORD SCHEMA
// ============================================

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/[A-Z]/,
				'Password must contain at least one uppercase letter'
			)
			.regex(
				/[a-z]/,
				'Password must contain at least one lowercase letter'
			)
			.regex(/[0-9]/, 'Password must contain at least one number')
			.regex(
				/[^A-Za-z0-9]/,
				'Password must contain at least one special character'
			),
		confirmNewPassword: z
			.string()
			.min(1, 'Please confirm your new password'),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: 'Passwords do not match',
		path: ['confirmNewPassword'],
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: 'New password must be different from current password',
		path: ['newPassword'],
	});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
