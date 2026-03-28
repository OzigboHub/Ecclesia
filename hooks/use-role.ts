'use client';

import { useSession } from 'next-auth/react';

// Role types from Prisma schema
export type UserRole =
	| 'SUPER_ADMIN'
	| 'PARISH_ADMIN'
	| 'PARISH_SECRETARY'
	| 'PARISH_STAFF'
	| 'OUTSTATION_ADMIN'
	| 'SOCIETY_PRESIDENT'
	| 'SOCIETY_SECRETARY'
	| 'PARISHIONER';

// Admin roles that can manage settings
const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'PARISH_ADMIN'];

// Staff roles that can record data
const STAFF_ROLES: UserRole[] = [
	'SUPER_ADMIN',
	'PARISH_ADMIN',
	'PARISH_SECRETARY',
	'PARISH_STAFF',
	'OUTSTATION_ADMIN',
];

// Roles that can manage societies
const SOCIETY_MANAGEMENT_ROLES: UserRole[] = [
	'SUPER_ADMIN',
	'PARISH_ADMIN',
	'SOCIETY_PRESIDENT',
	'SOCIETY_SECRETARY',
];

/**
 * Hook for checking user role and permissions
 * @returns Object with role information and permission checks
 */
export function useRole() {
	const { data: session, status } = useSession();
	const role = session?.user?.role as UserRole | undefined;

	const isLoading = status === 'loading';
	const isAuthenticated = status === 'authenticated' && !!session?.user;

	// Role level checks
	const isSuperAdmin = role === 'SUPER_ADMIN';
	const isParishAdmin = role === 'PARISH_ADMIN';
	const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
	const isStaff = role ? STAFF_ROLES.includes(role) : false;
	const canManageSocieties = role
		? SOCIETY_MANAGEMENT_ROLES.includes(role)
		: false;
	const isParishioner = role === 'PARISHIONER';

	/**
	 * Check if user has one of the specified roles
	 */
	const hasRole = (roles: UserRole | UserRole[]): boolean => {
		if (!role) return false;
		const roleArray = Array.isArray(roles) ? roles : [roles];
		return roleArray.includes(role);
	};

	/**
	 * Check if user can perform action based on required roles
	 */
	const canPerform = (requiredRoles: UserRole[]): boolean => {
		return hasRole(requiredRoles);
	};

	/**
	 * Check if user can modify another user based on role hierarchy
	 */
	const canModifyUser = (targetRole: UserRole): boolean => {
		if (!role) return false;

		const roleHierarchy: Record<UserRole, number> = {
			SUPER_ADMIN: 100,
			PARISH_ADMIN: 80,
			PARISH_SECRETARY: 60,
			PARISH_STAFF: 40,
			OUTSTATION_ADMIN: 40,
			SOCIETY_PRESIDENT: 30,
			SOCIETY_SECRETARY: 30,
			PARISHIONER: 10,
		};

		return roleHierarchy[role] > roleHierarchy[targetRole];
	};

	/**
	 * Check if user can record payments
	 */
	const canRecordPayments = isStaff;

	/**
	 * Check if user can manage users
	 */
	const canManageUsers = isAdmin;

	/**
	 * Check if user can toggle features
	 */
	const canToggleFeatures = isAdmin;

	/**
	 * Check if user can delete records (more restricted)
	 */
	const canDeleteRecords = isAdmin;

	/**
	 * Check if user can view reports
	 */
	const canViewReports = hasRole([
		'SUPER_ADMIN',
		'PARISH_ADMIN',
		'PARISH_SECRETARY',
		'OUTSTATION_ADMIN',
	]);

	return {
		// Status
		isLoading,
		isAuthenticated,

		// Role value
		role,

		// Role level checks
		isSuperAdmin,
		isParishAdmin,
		isAdmin,
		isStaff,
		isParishioner,
		canManageSocieties,

		// Permission checks
		canRecordPayments,
		canManageUsers,
		canToggleFeatures,
		canDeleteRecords,
		canViewReports,

		// Functions
		hasRole,
		canPerform,
		canModifyUser,
	};
}

export default useRole;
