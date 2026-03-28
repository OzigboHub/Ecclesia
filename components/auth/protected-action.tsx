'use client';

import { useSession } from 'next-auth/react';
import React from 'react';

interface ProtectedActionProps {
	allowedRoles: string[];
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

/**
 * A component that only renders its children if the current user has one of the allowed roles.
 *
 * @param allowedRoles - Array of roles that are permitted to see the content
 * @param children - The content to render if authorized
 * @param fallback - Optional content to render if not authorized
 */
export function ProtectedAction({
	allowedRoles,
	children,
	fallback = null,
}: ProtectedActionProps) {
	const { data: session, status } = useSession();

	if (status === 'loading') {
		return null;
	}

	const userRole = session?.user?.role;

	if (!userRole || !allowedRoles.includes(userRole)) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
