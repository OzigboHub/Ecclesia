import { getPendingUserAccountRequests } from "@/app/actions/user-account-request.actions";
import { getUsers, getUserStats } from "@/app/actions/user.actions";
import { auth } from "@/auth";
import { UserAccountRequests } from "@/components/features/users/user-account-requests";
import { UsersList } from "@/components/features/users/users-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCheck, UserPlus, Users, UserX } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Users | Ecclesia",
	description: "Manage parish users and roles",
};

export default async function UsersPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	// Only admins can access user management
	const allowedRoles = ["SUPER_ADMIN", "PARISH_ADMIN"];
	if (!allowedRoles.includes(session.user.role)) {
		redirect("/dashboard?error=unauthorized");
	}

	// Fetch users and stats in parallel
	const [usersResult, statsResult, requestsResult] = await Promise.all([
		// Include organization info for SUPER_ADMIN, exclude for others
		getUsers(session.user.role === "SUPER_ADMIN"),
		getUserStats(),
		session.user.role === "PARISH_ADMIN" ?
			getPendingUserAccountRequests()
		:	Promise.resolve({ success: true, data: [] }),
	]);

	if (!usersResult.success) {
		throw new Error(usersResult.message);
	}

	const users = usersResult.data ?? [];
	const stats = statsResult.data ?? {
		total: 0,
		active: 0,
		inactive: 0,
		byRole: {},
	};
	const pendingRequests =
		requestsResult.success ? (requestsResult.data ?? []) : [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Users</h1>
					<p className="text-muted-foreground">
						Manage user accounts and role assignments
					</p>
				</div>
				<Button asChild>
					<Link href="/users/new">
						<UserPlus className="mr-2 h-4 w-4" />
						Add User
					</Link>
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Users
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground">
							Registered accounts
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Users
						</CardTitle>
						<UserCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{stats.active}
						</div>
						<p className="text-xs text-muted-foreground">
							Can access system
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Inactive Users
						</CardTitle>
						<UserX className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{stats.inactive}
						</div>
						<p className="text-xs text-muted-foreground">
							Access disabled
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Admin Users
						</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{(stats.byRole["SUPER_ADMIN"] ?? 0) +
								(stats.byRole["PARISH_ADMIN"] ?? 0)}
						</div>
						<p className="text-xs text-muted-foreground">
							Super Admin & Parish Admin
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Pending Requests */}
			{session.user.role === "PARISH_ADMIN" &&
				(pendingRequests.length > 0 ?
					<UserAccountRequests requests={pendingRequests} />
				:	<Card>
						<CardHeader>
							<CardTitle>Pending User Account Requests</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								No pending requests right now.
							</p>
						</CardContent>
					</Card>)}

			{/* Users List */}
			<UsersList
				users={users}
				currentUserId={session.user.id}
				currentUserRole={session.user.role}
				isSuperAdmin={session.user.role === "SUPER_ADMIN"}
			/>
		</div>
	);
}
