import { auth } from '@/auth';

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
	const session = await auth();
	return session?.user ?? null;
}

/**
 * Require authentication - throws error if not authenticated
 * @returns The authenticated user
 * @throws Error if not authenticated
 */
export async function requireAuth() {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error('Authentication required');
	}
	return user;
}

/**
 * Require specific role(s) - throws error if user doesn't have required role
 * @param allowedRoles - Array of allowed role names
 * @returns The authenticated user with required role
 * @throws Error if not authenticated or insufficient permissions
 */
export async function requireRole(allowedRoles: string[]) {
	const user = await requireAuth();
	if (!allowedRoles.includes(user.role)) {
		throw new Error('Insufficient permissions');
	}
	return user;
}

/**
 * Get session with authorization check
 * @param allowedRoles - Array of allowed role names
 * @returns Object with authorized flag and session/reason
 */
export async function getAuthorizedSession(allowedRoles: string[]) {
	const session = await auth();

	if (!session) {
		return { authorized: false, reason: 'Unauthorized' } as const;
	}

	if (!allowedRoles.includes(session.user.role)) {
		return { authorized: false, reason: 'Permission denied' } as const;
	}

	return { authorized: true, session } as const;
}


export * from './permissions';
