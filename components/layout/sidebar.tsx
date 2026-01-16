'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	Users,
	DollarSign,
	Calendar,
	MessageSquare,
	Settings,
	LayoutDashboard,
	Church,
	LogOut,
	UserCog,
	Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation items with optional role restrictions
const navigation = [
	{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ name: 'Parishioners', href: '/dashboard/parishioners', icon: Users },
	{ name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
	{
		name: 'Mass Intentions',
		href: '/dashboard/mass-intentions',
		icon: Church,
	},
	{ name: 'Mass Calendar', href: '/dashboard/masses', icon: Calendar },
	{
		name: 'Mass Schedule',
		href: '/dashboard/mass-schedule',
		icon: Calendar,
		roles: ['SUPER_ADMIN', 'PARISH_ADMIN'],
	},
	{ name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
	{
		name: 'Pious Organizations',
		href: '/dashboard/organizations',
		icon: MessageSquare,
	},
	{ name: 'Settings', href: '/dashboard/settings', icon: Settings },
] as const;

// Admin-only navigation items
const adminNavigation = [
	{
		name: 'Manage Organizations',
		href: '/dashboard/admin/organizations',
		icon: Building2,
		roles: ['SUPER_ADMIN'], // Only super admin
	},
	{
		name: 'Users',
		href: '/dashboard/users',
		icon: UserCog,
		roles: ['SUPER_ADMIN', 'PARISH_ADMIN'], // Both admins
	},
] as const;

export function Sidebar() {
	const pathname = usePathname();
	const { data: session } = useSession();

	// Filter navigation items based on user role
	const visibleNavigation = navigation.filter((item) => {
		// All regular navigation is visible to all
		return true;
	});

	// Filter admin navigation items based on user role
	const visibleAdminNavigation = adminNavigation.filter((item) => {
		// All admin items require roles
		if (!('roles' in item) || !item.roles) return false;
		// Check if user's role is in the allowed roles
		return (
			session?.user?.role &&
			(item.roles as readonly string[]).includes(session.user.role)
		);
	});

	return (
		<div className='hidden md:flex md:w-64 md:flex-col'>
			<div className='flex flex-col flex-grow border-r border-border bg-background pt-5 pb-4 overflow-y-auto'>
				<div className='flex items-center flex-shrink-0 px-4 mb-6'>
					<Link
						href='/dashboard'
						className='flex items-center gap-3 hover:opacity-80 transition-opacity'
					>
						<img
							src='/logo-golden-yellow-on-black.png'
							alt='Ecclesia Logo'
							className='h-8 w-8'
						/>
						<h1 className='text-xl font-bold text-primary'>
							Ecclesia
						</h1>
					</Link>
				</div>

				<div className='mt-5 flex-grow flex flex-col'>
					<nav className='flex-1 px-2 space-y-1'>
						{visibleNavigation.map((item) => {
							// Dashboard should only match exactly, not sub-routes
							const isActive =
								item.href === '/dashboard'
									? pathname === '/dashboard'
									: pathname === item.href ||
									  pathname.startsWith(item.href + '/');
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
										isActive
											? 'bg-primary text-primary-foreground'
											: 'text-foreground hover:bg-accent hover:text-accent-foreground'
									)}
								>
									<item.icon
										className={cn(
											'mr-3 flex-shrink-0 h-5 w-5',
											isActive
												? 'text-primary-foreground'
												: 'text-muted-foreground'
										)}
									/>
									{item.name}
								</Link>
							);
						})}
					</nav>

					{/* Admin Section */}
					{visibleAdminNavigation.length > 0 && (
						<div className='border-t border-border mt-4 pt-4'>
							<p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
								Administration
							</p>
							<nav className='px-2 space-y-1'>
								{visibleAdminNavigation.map((item) => {
									const isActive =
										pathname === item.href ||
										pathname.startsWith(item.href + '/');
									return (
										<Link
											key={item.name}
											href={item.href}
											className={cn(
												'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
												isActive
													? 'bg-primary text-primary-foreground'
													: 'text-foreground hover:bg-accent hover:text-accent-foreground'
											)}
										>
											<item.icon
												className={cn(
													'mr-3 flex-shrink-0 h-5 w-5',
													isActive
														? 'text-primary-foreground'
														: 'text-muted-foreground'
												)}
											/>
											{item.name}
										</Link>
									);
								})}
							</nav>
						</div>
					)}
				</div>

				{/* User Profile */}
				<div className='flex-shrink-0 flex border-t border-border p-4'>
					<div className='flex items-center w-full'>
						<div className='flex-1'>
							<p className='text-sm font-medium'>
								{session?.user?.name}
							</p>
							<p className='text-xs text-muted-foreground'>
								{session?.user?.role}
							</p>
						</div>
						<button
							onClick={() =>
								signOut({ callbackUrl: '/auth/login' })
							}
							className='ml-3 p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors'
							title='Sign out'
						>
							<LogOut className='h-5 w-5' />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
