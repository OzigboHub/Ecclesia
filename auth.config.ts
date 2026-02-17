import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import db from '@/lib/db';
import { loginSchema } from '@/lib/validators/auth.schema';

export const authConfig: NextAuthConfig = {
	providers: [
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				try {
					// Validate credentials with Zod
					const { email, password } = await loginSchema.parseAsync(
						credentials
					);

					// Find user by email
					const user = await db.user.findUnique({
						where: { email },
						include: { organization: true },
					});

					// Check if user exists and has a password
					if (!user || !user.password) {
						return null;
					}

					// Check if account is active
					if (!user.isActive) {
						return null;
					}

					// Verify password
					const isValid = await bcrypt.compare(
						password,
						user.password
					);

					if (!isValid) {
						return null;
					}

					// Update last login timestamp
					await db.user.update({
						where: { id: user.id },
						data: { lastLogin: new Date() },
					});

					// NEW: Look up parishioner record if any
					const parishioner = await db.parishioner.findUnique({
						where: { email: user.email },
					});

					// Return user data for JWT
					return {
						id: user.id,
						email: user.email,
						name: `${user.firstName} ${user.lastName}`,
						role: user.role,
						organizationId: user.organizationId,
						organizationName: user.organization?.name ?? null,
						parishionerId: parishioner?.id ?? null,
					};
				} catch (error) {
					// Handle Zod validation errors - return null to indicate invalid credentials
					if (error instanceof ZodError) {
						return null;
					}
					// Log unexpected errors and return null
					console.error('Auth error:', error);
					return null;
				}
			},
		}),
	],
	session: {
		strategy: 'jwt',
		maxAge: 24 * 60 * 60, // 24 hours
	},
	callbacks: {
		jwt({ token, user }) {
			// Initial sign in - extend token with custom user fields
			if (user) {
				token.id = user.id as string;
				token.role = (user as unknown as Record<string, unknown>)
					.role as string;
				token.organizationId = (
					user as unknown as Record<string, unknown>
				).organizationId as string;
				token.organizationName = (
					user as unknown as Record<string, unknown>
				).organizationName as string | null;
				token.parishionerId = (
					user as unknown as Record<string, unknown>
				).parishionerId as string | null;
			}
			return token;
		},
		session({ session, token }) {
			// Extend session with custom fields from token
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
				session.user.organizationId = token.organizationId as string;
				session.user.organizationName = token.organizationName as
					| string
					| null;
				session.user.parishionerId = token.parishionerId as
					| string
					| null;
			}
			return session;
		},
	},
	pages: {
		signIn: '/auth/login',
		error: '/auth/error',
	},
};
