import { getActivePaymentTypes } from "@/app/actions/payment-type.actions";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PayClient } from "./pay-client";

export default async function PayPage() {
	const session = await auth();
	if (!session?.user) redirect("/auth/login");

	const canManagePaymentTypes = [
		"SUPER_ADMIN",
		"PARISH_ADMIN",
		"PARISH_SECRETARY",
	].includes(session.user.role);

	const result = await getActivePaymentTypes();
	const paymentTypes =
		result.success ? (result.data as PaymentTypeData[]) : [];

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Make a Payment</h1>
					<p className="text-sm text-muted-foreground">
						Select a payment type below to make your contribution
					</p>
				</div>
				{canManagePaymentTypes && (
					<Button
						asChild
						variant="outline"
						size="sm"
						className="w-fit"
					>
						<Link href="/payments/types">
							<Plus className="mr-2 h-4 w-4" />
							Add Payment Type
						</Link>
					</Button>
				)}
			</div>
			<PayClient
				paymentTypes={paymentTypes}
				userEmail={session.user.email || ""}
				userName={session.user.name || ""}
				parishionerId={session.user.parishionerId}
				organizationId={session.user.organizationId}
			/>
		</div>
	);
}

type PaymentTypeData = {
	id: string;
	name: string;
	description: string | null;
	category: string;
	isActive: boolean;
};
