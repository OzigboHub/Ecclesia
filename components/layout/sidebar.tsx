'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home, Users, DollarSign, Calendar, MessageSquare,
    Settings, LayoutDashboard, Church, LogOut, User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Parishioners', href: '/dashboard/parishioners', icon: Users },
    { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
    { name: 'Mass Intentions', href: '/dashboard/mass-intentions', icon: Church },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Organizations', href: '/dashboard/organizations', icon: MessageSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    return (
        <div className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow border-r border-border bg-background pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 mb-6">
                    <h1 className="text-2xl font-bold text-primary">Ecclesia</h1>
                </div>

                <div className="mt-5 flex-grow flex flex-col">
                    <nav className="flex-1 px-2 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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
                                            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                                        )}
                                    />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* User Profile */}
                <div className="flex-shrink-0 flex border-t border-border p-4">
                    <div className="flex items-center w-full">
                        <div className="flex-1">
                            <p className="text-sm font-medium">{session?.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/auth/login' })}
                            className="ml-3 p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
