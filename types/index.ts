/**
 * Standard response type for Server Actions
 */
export interface ActionResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	errors?: Record<string, string[]>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> extends ActionResponse<T[]> {
	pagination?: PaginationMeta;
}

/**
 * User properties for components
 */
export interface UserProps {
	id: string | undefined | null;
	email?: string | undefined | null;
	name: string | undefined;
	role: string | undefined | null;
	organizationId: string | undefined | null;
	organizationName: string | undefined | null;
}
