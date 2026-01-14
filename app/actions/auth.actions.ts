'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { loginSchema } from '@/lib/validators/auth.schema';
import type { ActionResponse } from '@/types';
import { UserRole } from '@prisma/client';

/**
 * Login action - authenticates user with email and password
 */
export async function login(data: {
	email: string;
	password: string;
}): Promise<ActionResponse> {
	try {
		// Validate input
		const parsed = loginSchema.safeParse(data);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Invalid email or password format',
			};
		}

		await signIn('credentials', {
			email: parsed.data.email,
			password: parsed.data.password,
			redirect: false,
		});

		return { success: true, message: 'Login successful' };
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case 'CredentialsSignin':
					return {
						success: false,
						message: 'Invalid email or password',
					};
				default:
					return { success: false, message: 'Something went wrong' };
			}
		}
		throw error;
	}
}

/**
 * Logout action - signs out the current user
 */
export async function logout(): Promise<ActionResponse> {
	try {
		await signOut({ redirect: false });
		return { success: true, message: 'Logged out successfully' };
	} catch (error) {
		console.error('Logout error:', error);
		return { success: false, message: 'Failed to logout' };
	}
}

/**
 * Register action - creates a new user account
 */
export async function register(data: {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	organizationId: string;
	role?: string;
}): Promise<ActionResponse> {
	try {
		// Check if user already exists
		const existingUser = await db.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			return {
				success: false,
				message: 'A user with this email already exists',
			};
		}

		// Verify organization exists
		const organization = await db.organization.findUnique({
			where: { id: data.organizationId },
		});

		if (!organization) {
			return { success: false, message: 'Invalid organization' };
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(data.password, 10);

		// Create user
		const user = await db.user.create({
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				password: hashedPassword,
				organizationId: data.organizationId,
				role: (data.role as unknown as UserRole) || 'PARISHIONER',
				isActive: true,
			},
		});

		return {
			success: true,
			message: 'Account created successfully',
			data: { id: user.id },
		};
	} catch (error) {
		console.error('Registration error:', error);
		return { success: false, message: 'Failed to create account' };
	}
}
