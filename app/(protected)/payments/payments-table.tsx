"use client";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";

type PaymentRow = {
	id: string;
	receiptNumber: string | null;
	payerName: string;
	onBehalfOf: string | null;
	purpose: string;
	month: number | null;
	amount: number;
	paymentMethod: string;
	paymentDate: string | Date;
	paymentStatus: string;
	parishioner: {
		firstName: string;
		lastName: string;
	} | null;
};

function getMonthName(month: number): string {
	const months = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
	];
	return months[month - 1] || "";
}

function StatusBadge({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
				status === "COMPLETED" &&
					"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
				status === "PENDING" &&
					"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
				status === "FAILED" &&
					"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
				status === "REFUNDED" &&
					"bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
			)}
		>
			{status}
		</span>
	);
}

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
	}).format(amount);

const formatDate = (date: string | Date) =>
	new Date(date).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

const columns = [
	{
		header: "Receipt",
		accessorKey: "receiptNumber",
		cell: (row: PaymentRow) => (
			<span className="font-mono text-xs text-muted-foreground">
				{row.receiptNumber || "-"}
			</span>
		),
	},
	{
		header: "Payer",
		accessorKey: "payerName",
		cell: (row: PaymentRow) => (
			<div>
				<div className="font-medium text-foreground">
					{row.payerName}
				</div>
				{row.parishioner && (
					<div className="text-xs text-muted-foreground">
						{row.parishioner.firstName} {row.parishioner.lastName}
					</div>
				)}
				{row.onBehalfOf && (
					<div className="text-xs text-muted-foreground">
						On behalf of: {row.onBehalfOf}
					</div>
				)}
			</div>
		),
	},
	{
		header: "Purpose",
		accessorKey: "purpose",
		cell: (row: PaymentRow) => (
			<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
				{row.purpose.replace(/_/g, " ")}
				{row.month && ` (${getMonthName(row.month)})`}
			</span>
		),
	},
	{
		header: "Amount",
		accessorKey: "amount",
		cell: (row: PaymentRow) => (
			<span className="font-bold text-foreground">
				{formatCurrency(row.amount)}
			</span>
		),
	},
	{
		header: "Method",
		accessorKey: "paymentMethod",
		cell: (row: PaymentRow) => (
			<span className="text-muted-foreground text-xs">
				{row.paymentMethod.replace(/_/g, " ")}
			</span>
		),
	},
	{
		header: "Date",
		accessorKey: "paymentDate",
		cell: (row: PaymentRow) => formatDate(row.paymentDate),
	},
	{
		header: "Status",
		accessorKey: "paymentStatus",
		cell: (row: PaymentRow) => <StatusBadge status={row.paymentStatus} />,
	},
];

function PaymentCard({ payment }: { payment: PaymentRow }) {
	return (
		<Link
			href={`/payments/${payment.id}`}
			className="block rounded-lg border border-border bg-background p-3 hover:bg-accent/50 transition-colors"
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm text-foreground truncate">
						{payment.payerName}
					</p>
					{payment.parishioner && (
						<p className="text-xs text-muted-foreground truncate">
							{payment.parishioner.firstName} {payment.parishioner.lastName}
						</p>
					)}
				</div>
				<p className="font-bold text-sm text-foreground whitespace-nowrap">
					{formatCurrency(payment.amount)}
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-2 mt-2">
				<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
					{payment.purpose.replace(/_/g, " ")}
					{payment.month && ` (${getMonthName(payment.month)})`}
				</span>
				<StatusBadge status={payment.paymentStatus} />
			</div>
			<div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
				<span>{formatDate(payment.paymentDate)}</span>
				<span>{payment.paymentMethod.replace(/_/g, " ")}</span>
				{payment.receiptNumber && (
					<span className="font-mono">{payment.receiptNumber}</span>
				)}
			</div>
		</Link>
	);
}

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
	const isMobile = useIsMobile();

	if (payments.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">
					No payments recorded yet
				</p>
				<Button asChild className="mt-4">
					<Link href="/payments/new">
						Record First Payment
					</Link>
				</Button>
			</div>
		);
	}

	if (isMobile) {
		return (
			<div className="space-y-2">
				{payments.map((payment) => (
					<PaymentCard key={payment.id} payment={payment} />
				))}
			</div>
		);
	}

	return (
		<DataTable
			columns={columns}
			data={payments}
			isLoading={false}
			actions={(row) => (
				<div className="flex items-center justify-end gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="text-xs"
						asChild
					>
						<Link href={`/payments/${row.id}`}>
							View
						</Link>
					</Button>
				</div>
			)}
		/>
	);
}
