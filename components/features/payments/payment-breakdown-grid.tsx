"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Wallet, Banknote, Hourglass, AlertCircle, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PaymentBreakdownGridProps {
	stats: {
		totalAmount: number;
		totalCount: number;
		paystackRevenue: number;
		offlineRevenue: number;
		manualDigitalRevenue: number;
		pendingPaymentsCount: number;
		pendingPaymentsAmount: number;
		failedPaymentsCount: number;
		failedPaymentsAmount: number;
	};
}

export function PaymentBreakdownGrid({ stats }: PaymentBreakdownGridProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const items = [
		{
			title: "Online Revenue (Paystack)",
			amount: stats.paystackRevenue,
			description: "Completed digital transactions routed through Paystack gateway",
			color: "border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400",
			iconColor: "text-emerald-500",
			icon: CreditCard,
		},
		{
			title: "Offline Revenue (Manual)",
			amount: stats.offlineRevenue,
			description: "Completed payments recorded by staff using cash or checks",
			color: "border-blue-500/25 bg-blue  text-white",
			iconColor: "text-blue-500",
			icon: Banknote,
		},
		{
			title: "Manual Digital (Unverified)",
			amount: stats.manualDigitalRevenue,
			description: "Recorded manually as card/transfer but bypasses Paystack tracking",
			color: "border-amber-500/25 bg-amber-50/50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400",
			iconColor: "text-amber-500",
			icon: Wallet,
			tooltip: "These are payments recorded manually as bank transfer/card by admins without routing through Paystack checkout. Verify offline statements to confirm."
		},
		{
			title: "Pending Payments",
			amount: stats.pendingPaymentsAmount,
			count: stats.pendingPaymentsCount,
			description: "Initiated online payments that are not yet completed",
			color: "border-yellow-500/25 bg-yellow-50/50 dark:bg-yellow-950/10 text-yellow-700 dark:text-yellow-400",
			iconColor: "text-yellow-500",
			icon: Hourglass,
		},
		{
			title: "Failed Payments",
			amount: stats.failedPaymentsAmount,
			count: stats.failedPaymentsCount,
			description: "Unsuccessful online transactions",
			color: "border-red-500/25 bg-red-50/50 dark:bg-red-950/10 text-red-700 dark:text-red-400",
			iconColor: "text-red-500",
			icon: AlertCircle,
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold tracking-tight">Structured Revenue & Transaction Breakdown</h3>
				<span className="text-xs text-muted-foreground flex items-center gap-1">
					<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
					Showing current calendar year summary
				</span>
			</div>
			
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				{items.map((item) => {
					const Icon = item.icon;
					return (
						<Card key={item.title} className={`border border-solid ${item.color} shadow-sm transition-all hover:scale-[1.01] hover:shadow-md duration-200`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-85">
									{item.title}
								</CardTitle>
								<div className="flex items-center gap-1">
									{item.tooltip && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Info className="h-3.5 w-3.5 cursor-pointer opacity-75 hover:opacity-100" />
												</TooltipTrigger>
												<TooltipContent side="top" className="max-w-xs text-xs">
													{item.tooltip}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
									<Icon className={`h-4 w-4 ${item.iconColor}`} />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-xl font-bold tracking-tight">
									{formatCurrency(item.amount)}
								</div>
								<div className="text-[10px] opacity-80 mt-1.5 leading-snug">
									{item.count !== undefined ? (
										<span className="font-semibold block">{item.count} transactions</span>
									) : null}
									{item.description}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
