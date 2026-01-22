'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toggleUserStatus, deleteUser } from '@/app/actions/user.actions';
import {
    roleLabels,
    userRoles,
    type UserRoleType,
} from '@/lib/validators/user.schema';
import { toast } from 'sonner';
import {
    Edit2,
    Trash2,
    Search,
    MoreHorizontal,
    UserCheck,
    UserX,
    KeyRound,
    Shield,
    Filter,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Safe user type (without password)
type SafeUser = Omit<User, 'password'> & {
	organization?: { id: string; name: string } | null;
};

interface UsersListProps {
	users: SafeUser[];
	currentUserId: string;
	currentUserRole: string;
	isSuperAdmin?: boolean;
}

// Role badge variant mapping
const roleBadgeVariant: Record<
	string,
	'default' | 'secondary' | 'outline' | 'destructive'
> = {
	SUPER_ADMIN: 'destructive',
	PARISH_ADMIN: 'default',
	PARISH_SECRETARY: 'secondary',
	PARISH_STAFF: 'secondary',
	OUTSTATION_ADMIN: 'default',
	SOCIETY_PRESIDENT: 'outline',
	SOCIETY_SECRETARY: 'outline',
	PARISHIONER: 'outline',
};

export function UsersList({
	users: initialUsers,
	currentUserId,
	currentUserRole,
	isSuperAdmin = false,
}: UsersListProps) {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState('');
	const [roleFilter, setRoleFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [userToToggle, setUserToToggle] = useState<SafeUser | null>(null);
	const [userToDelete, setUserToDelete] = useState<SafeUser | null>(null);
	const [isTogglingStatus, setIsTogglingStatus] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Role hierarchy for permission checks
	const roleHierarchy: Record<string, number> = {
		SUPER_ADMIN: 100,
		PARISH_ADMIN: 80,
		PARISH_SECRETARY: 60,
		PARISH_STAFF: 40,
		OUTSTATION_ADMIN: 40,
		SOCIETY_PRESIDENT: 30,
		SOCIETY_SECRETARY: 30,
		PARISHIONER: 10,
	};

	const canModifyUser = (targetRole: string) => {
		const currentLevel = roleHierarchy[currentUserRole] ?? 0;
		const targetLevel = roleHierarchy[targetRole] ?? 0;
		return currentLevel > targetLevel;
	};

	// Filter users based on search and filters
	const filteredUsers = initialUsers.filter((user) => {
		const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`
			.toLowerCase()
			.includes(searchTerm.toLowerCase());

		const matchesRole = roleFilter === 'all' || user.role === roleFilter;
		const matchesStatus =
			statusFilter === 'all' ||
			(statusFilter === 'active' && user.isActive) ||
			(statusFilter === 'inactive' && !user.isActive);

		return matchesSearch && matchesRole && matchesStatus;
	});

	const handleToggleStatus = async () => {
		if (!userToToggle) return;

		setIsTogglingStatus(true);
		const result = await toggleUserStatus(userToToggle.id);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			toast.error(result.message);
		}

		setIsTogglingStatus(false);
		setUserToToggle(null);
	};

	const handleDelete = async () => {
		if (!userToDelete) return;

		setIsDeleting(true);
		const result = await deleteUser(userToDelete.id);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			toast.error(result.message);
		}

		setIsDeleting(false);
		setUserToDelete(null);
	};

	const getInitials = (firstName: string, lastName: string) => {
		return `${firstName[0]}${lastName[0]}`.toUpperCase();
	};

	const clearFilters = () => {
		setSearchTerm('');
		setRoleFilter('all');
		setStatusFilter('all');
	};

	const hasActiveFilters =
		searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

	return (
		<div className='space-y-4'>
			{/* Search and Filters */}
			<div className='flex flex-col gap-4 md:flex-row md:items-center'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						type='search'
						placeholder='Search users by name or email...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='pl-10'
					/>
				</div>

				<div className='flex gap-2'>
					<Select
						value={roleFilter}
						onValueChange={setRoleFilter}
					>
						<SelectTrigger className='w-[180px]'>
							<SelectValue placeholder='Filter by role' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Roles</SelectItem>
							{userRoles.map((role) => (
								<SelectItem
									key={role}
									value={role}
								>
									{roleLabels[role]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={statusFilter}
						onValueChange={setStatusFilter}
					>
						<SelectTrigger className='w-[140px]'>
							<SelectValue placeholder='Filter by status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Status</SelectItem>
							<SelectItem value='active'>Active</SelectItem>
							<SelectItem value='inactive'>Inactive</SelectItem>
						</SelectContent>
					</Select>

					{hasActiveFilters && (
						<Button
							variant='ghost'
							size='sm'
							onClick={clearFilters}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* Stats */}
			<div className='flex items-center justify-between text-sm text-muted-foreground'>
				<p>
					Showing {filteredUsers.length} of {initialUsers.length}{' '}
					user(s)
				</p>
				<div className='flex items-center gap-4'>
					<span className='flex items-center gap-1'>
						<span className='h-2 w-2 rounded-full bg-green-500'></span>
						{initialUsers.filter((u) => u.isActive).length} Active
					</span>
					<span className='flex items-center gap-1'>
						<span className='h-2 w-2 rounded-full bg-gray-400'></span>
						{initialUsers.filter((u) => !u.isActive).length}{' '}
						Inactive
					</span>
				</div>
			</div>

			{/* Users Table */}
			{filteredUsers.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-12 text-center'>
					<div className='rounded-full bg-muted p-4 mb-4'>
						<Filter className='h-8 w-8 text-muted-foreground' />
					</div>
					<h3 className='text-lg font-semibold'>No users found</h3>
					<p className='text-muted-foreground mt-1'>
						{hasActiveFilters
							? 'Try adjusting your search or filters'
							: 'Add your first user to get started'}
					</p>
					{hasActiveFilters && (
						<Button
							variant='outline'
							className='mt-4'
							onClick={clearFilters}
						>
							Clear Filters
						</Button>
					)}
				</div>
			) : (
				<div className='rounded-lg border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								{isSuperAdmin && (
									<TableHead>Organization</TableHead>
								)}
								<TableHead>Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className='hidden md:table-cell'>
									Last Login
								</TableHead>
								<TableHead className='text-right'>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredUsers.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div className='flex items-center gap-3'>
											<Avatar>
												<AvatarFallback>
													{getInitials(
														user.firstName,
														user.lastName
													)}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className='font-medium'>
													{user.firstName}{' '}
													{user.lastName}
													{user.id ===
														currentUserId && (
														<span className='ml-2 text-xs text-muted-foreground'>
															(You)
														</span>
													)}
												</p>
												<p className='text-sm text-muted-foreground'>
													{user.email}
												</p>
											</div>
										</div>
									</TableCell>
									{isSuperAdmin && (
										<TableCell>
											<p className='text-sm'>
												{user.organization?.name ||
													'No organization'}
											</p>
										</TableCell>
									)}
									<TableCell>
										<Badge
											variant={
												roleBadgeVariant[user.role] ||
												'outline'
											}
										>
											<Shield className='mr-1 h-3 w-3' />
											{roleLabels[
												user.role as UserRoleType
											] || user.role}
										</Badge>
									</TableCell>
									<TableCell>
										{user.isActive ? (
											<Badge
												variant='outline'
												className='text-green-600 border-green-600'
											>
												<UserCheck className='mr-1 h-3 w-3' />
												Active
											</Badge>
										) : (
											<Badge
												variant='outline'
												className='text-gray-500 border-gray-500'
											>
												<UserX className='mr-1 h-3 w-3' />
												Inactive
											</Badge>
										)}
									</TableCell>
									<TableCell className='hidden md:table-cell'>
										{user.lastLogin ? (
											<span className='text-sm text-muted-foreground'>
												{formatDistanceToNow(
													new Date(user.lastLogin),
													{
														addSuffix: true,
													}
												)}
											</span>
										) : (
											<span className='text-sm text-muted-foreground'>
												Never
											</span>
										)}
									</TableCell>
									<TableCell className='text-right'>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='ghost'
													size='icon'
												>
													<MoreHorizontal className='h-4 w-4' />
													<span className='sr-only'>
														Open menu
													</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>
													Actions
												</DropdownMenuLabel>
												<DropdownMenuSeparator />

												{/* Edit - only if can modify */}
												{canModifyUser(user.role) && (
													<DropdownMenuItem asChild>
														<Link
															href={`/dashboard/users/${user.id}/edit`}
														>
															<Edit2 className='mr-2 h-4 w-4' />
															Edit User
														</Link>
													</DropdownMenuItem>
												)}

												{/* Change Password - only if can modify */}
												{canModifyUser(user.role) && (
													<DropdownMenuItem asChild>
														<Link
															href={`/dashboard/users/${user.id}/password`}
														>
															<KeyRound className='mr-2 h-4 w-4' />
															Change Password
														</Link>
													</DropdownMenuItem>
												)}

												{/* Toggle Status - not for self, only if can modify */}
												{user.id !== currentUserId &&
													canModifyUser(
														user.role
													) && (
														<DropdownMenuItem
															onClick={() =>
																setUserToToggle(
																	user
																)
															}
														>
															{user.isActive ? (
																<>
																	<UserX className='mr-2 h-4 w-4' />
																	Deactivate
																</>
															) : (
																<>
																	<UserCheck className='mr-2 h-4 w-4' />
																	Activate
																</>
															)}
														</DropdownMenuItem>
													)}

												{/* Delete - only super admin, not self */}
												{currentUserRole ===
													'SUPER_ADMIN' &&
													user.id !== currentUserId &&
													user.role !==
														'SUPER_ADMIN' && (
														<>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() =>
																	setUserToDelete(
																		user
																	)
																}
																className='text-destructive'
															>
																<Trash2 className='mr-2 h-4 w-4' />
																Delete User
															</DropdownMenuItem>
														</>
													)}
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Toggle Status Dialog */}
			<AlertDialog
				open={!!userToToggle}
				onOpenChange={() => setUserToToggle(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{userToToggle?.isActive
								? 'Deactivate User?'
								: 'Activate User?'}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{userToToggle?.isActive
								? `This will prevent ${userToToggle.firstName} ${userToToggle.lastName} from logging in. You can reactivate them later.`
								: `This will allow ${userToToggle?.firstName} ${userToToggle?.lastName} to log in and use the system.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isTogglingStatus}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleToggleStatus}
							disabled={isTogglingStatus}
							className={
								userToToggle?.isActive
									? 'bg-destructive hover:bg-destructive/90'
									: ''
							}
						>
							{isTogglingStatus
								? 'Processing...'
								: userToToggle?.isActive
								? 'Deactivate'
								: 'Activate'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Dialog */}
			<AlertDialog
				open={!!userToDelete}
				onOpenChange={() => setUserToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete User?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently
							delete{' '}
							<strong>
								{userToDelete?.firstName}{' '}
								{userToDelete?.lastName}
							</strong>{' '}
							and remove their data from the system.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className='bg-destructive hover:bg-destructive/90'
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
