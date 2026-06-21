"use client";

import type { OrganizationDashboardMetrics } from "@/app/actions/dashboard.actions";
import { OutstationUserAccountRequest } from "@/components/features/dashboard/outstation-user-account-request";
import { NairaSign } from "@/components/ui/naira-sign";
import { canViewFinancialDashboard } from "@/lib/permissions";
import { Building2, Calendar, Church, Users } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";

import { PaymentBreakdownGrid } from "@/components/features/payments/payment-breakdown-grid";

interface OrganizationDashboardProps {
	session: Session;
	announcements: any[];
	metrics: OrganizationDashboardMetrics;
}

export function OrganizationDashboard({
	session,
	announcements,
	metrics,
}: OrganizationDashboardProps) {
	const canViewFinancials = canViewFinancialDashboard(session.user.role);
	const isOutstationAdmin = session.user.role === "OUTSTATION_ADMIN";

	const stats = [
		{
			name: "Total Parishioners",
			value: metrics.totalParishioners.toLocaleString("en-NG"),
			icon: Users,
			change: "",
		},
		...(canViewFinancials ?
			[
				{
					name: "Completed Payments",
					value: `₦${metrics.totalPaymentAmount.toLocaleString("en-NG")}`,
					icon: NairaSign,
					change: `${metrics.totalPayments.toLocaleString("en-NG")} records`,
				},
			]
		:	[]),
		{
			name: "Upcoming Appointments",
			value: metrics.upcomingAppointments.toLocaleString("en-NG"),
			icon: Calendar,
			change: "",
		},
		{
			name: "Mass Intentions",
			value: metrics.totalMassIntentions.toLocaleString("en-NG"),
			icon: Church,
			change: "",
		},
	];

	const formatActivityTime = (value: Date | string) => {
		const date = new Date(value);
		return date.toLocaleString("en-GB", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground">
					Welcome back, {session.user.name?.split(" ")[0] || "there"}!
				</h1>
				<p className="text-muted-foreground mt-1">
					{session.user.organizationName}
				</p>
			</div>

			{isOutstationAdmin && (
				<div className="mb-8 space-y-4">
					<div className="bg-background border border-border rounded-lg shadow-sm p-5">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
									<Building2 className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm font-semibold text-foreground">
										{session.user.organizationName}
									</p>
									<p className="text-xs text-muted-foreground">
										Outstation profile
									</p>
								</div>
							</div>
							<Link
								href="/organization"
								className="text-sm text-primary hover:underline"
							>
								Manage profile
							</Link>
						</div>
					</div>
					<OutstationUserAccountRequest />
				</div>
			)}

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
				{stats.map((stat) => (
					<div
						key={stat.name}
						className="bg-background border border-border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
					>
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex shrink-0">
									<div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
										<stat.icon className="h-6 w-6" />
									</div>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-muted-foreground truncate">
											{stat.name}
										</dt>
										<dd className="flex items-baseline">
											<div className="text-2xl font-semibold text-foreground">
												{stat.value}
											</div>
											{stat.change && (
												<div className="ml-2 flex items-baseline text-xs font-semibold text-muted-foreground">
													{stat.change}
												</div>
											)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Financial Breakdown */}
			{canViewFinancials && (
				<div className="mb-8 bg-background border border-border rounded-lg shadow-sm p-6">
					<PaymentBreakdownGrid stats={{
						...metrics,
						totalAmount: metrics.totalPaymentAmount,
						totalCount: metrics.totalPayments,
					}} />
				</div>
			)}

			{/* Quick Actions */}
			<div className="bg-background border border-border rounded-lg shadow-sm p-6">
				<h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<Link
						href="/payments"
						className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left"
					>
						<NairaSign className="h-8 w-8 text-primary mb-2" />
						<h3 className="font-medium">Record Payment</h3>
						<p className="text-sm text-muted-foreground">
							Add offering or donation
						</p>
					</Link>
					<Link
						href="/parishioners"
						className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left"
					>
						<Users className="h-8 w-8 text-primary mb-2" />
						<h3 className="font-medium">Add Parishioner</h3>
						<p className="text-sm text-muted-foreground">
							Register new member
						</p>
					</Link>
					<Link
						href="/mass-intentions"
						className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left"
					>
						<Church className="h-8 w-8 text-primary mb-2" />
						<h3 className="font-medium">Book Mass Intention</h3>
						<p className="text-sm text-muted-foreground">
							Schedule mass intention
						</p>
					</Link>
					<Link
						href="/appointments"
						className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left"
					>
						<Calendar className="h-8 w-8 text-primary mb-2" />
						<h3 className="font-medium">New Appointment</h3>
						<p className="text-sm text-muted-foreground">
							Schedule appointment
						</p>
					</Link>
				</div>
			</div>

			{/* Announcements */}
			{announcements.length > 0 && (
				<div className="mt-8 bg-background border border-border rounded-lg shadow-sm p-6">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Announcements</h2>
						<a
							href="/dashboard/announcements"
							className="text-sm text-primary hover:underline"
						>
							View all
						</a>
					</div>
					<div className="mt-4 space-y-4">
						{announcements.map((announcement) => (
							<div
								key={announcement.id}
								className="rounded-md border border-border p-4"
							>
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="font-semibold text-foreground">
											{announcement.title}
										</p>
										<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
											{announcement.content}
										</p>
									</div>
									<span className="text-xs text-muted-foreground">
										{announcement.publishedAt ?
											new Date(
												announcement.publishedAt,
											).toLocaleDateString("en-GB", {
												day: "2-digit",
												month: "short",
											})
										:	""}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Recent Activity */}
			<div className="mt-8 bg-background border border-border rounded-lg shadow-sm p-6">
				<h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
				<div className="space-y-4">
					{metrics.recentActivity.length === 0 ?
						<p className="text-sm text-muted-foreground">
							No recent activity yet.
						</p>
					:	metrics.recentActivity.map((activity) => (
							<div
								key={activity.id}
								className="flex items-start space-x-3 text-sm"
							>
								<div className="flex shrink-0">
									<div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
								</div>
								<div className="flex-1">
									<p className="text-foreground">
										{activity.details.message}
									</p>
									<p className="text-muted-foreground text-xs mt-1">
										{formatActivityTime(activity.createdAt)}
									</p>
								</div>
							</div>
						))
					}
				</div>
			</div>
		</div>
	);
}
