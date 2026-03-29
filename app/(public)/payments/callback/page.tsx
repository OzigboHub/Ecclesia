import { verifyPaystackPayment } from "@/app/actions/paystack.actions";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PaymentCallbackPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const searchParams = await searchParamsPromise;
	const reference = searchParams.reference || searchParams.trxref;

	if (!reference) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="max-w-md w-full bg-background border border-border rounded-lg p-6 text-center space-y-4">
					<XCircle className="mx-auto h-12 w-12 text-destructive" />
					<h1 className="text-xl font-bold text-foreground">
						Invalid Payment Reference
					</h1>
					<p className="text-muted-foreground text-sm">
						No payment reference was found. If you made a payment,
						please contact the parish office with your transaction details.
					</p>
					<Button asChild variant="outline">
						<Link href="/">
							<ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const result = await verifyPaystackPayment(reference);
	const payment = result.data as {
		id?: string;
		amount?: number;
		paymentStatus?: string;
		purpose?: string;
		receiptNumber?: string;
		payerName?: string;
		massIntentionId?: string;
	} | undefined;

	const isSuccess = result.success && payment?.paymentStatus === "COMPLETED";
	const isPending = payment?.paymentStatus === "PENDING";

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-background border border-border rounded-lg p-6 text-center space-y-4">
				{isSuccess ? (
					<>
						<CheckCircle className="mx-auto h-14 w-14 text-green-600" />
						<h1 className="text-xl font-bold text-foreground">
							Payment Successful
						</h1>
						<p className="text-muted-foreground text-sm">
							Thank you, {payment?.payerName || "Guest"}! Your{" "}
							{payment?.purpose?.replace(/_/g, " ").toLowerCase() || "payment"}{" "}
							of{" "}
							<span className="font-bold text-foreground">
								{new Intl.NumberFormat("en-NG", {
									style: "currency",
									currency: "NGN",
								}).format(payment?.amount || 0)}
							</span>{" "}
							has been confirmed.
						</p>
						{payment?.receiptNumber && (
							<p className="text-xs text-muted-foreground">
								Receipt: <span className="font-mono">{payment.receiptNumber}</span>
							</p>
						)}
						{payment?.massIntentionId && (
							<p className="text-sm text-muted-foreground">
								Your mass intention has been submitted and will be reviewed by the parish.
							</p>
						)}
					</>
				) : isPending ? (
					<>
						<Clock className="mx-auto h-14 w-14 text-yellow-500" />
						<h1 className="text-xl font-bold text-foreground">
							Payment Processing
						</h1>
						<p className="text-muted-foreground text-sm">
							Your payment is still being processed. This usually
							completes within a few minutes. You&apos;ll receive a
							confirmation once it&apos;s done.
						</p>
						<p className="text-xs text-muted-foreground font-mono">
							Reference: {reference}
						</p>
					</>
				) : (
					<>
						<XCircle className="mx-auto h-14 w-14 text-destructive" />
						<h1 className="text-xl font-bold text-foreground">
							Payment Failed
						</h1>
						<p className="text-muted-foreground text-sm">
							{result.message || "Your payment could not be verified."}
						</p>
						<p className="text-xs text-muted-foreground font-mono">
							Reference: {reference}
						</p>
						<p className="text-sm text-muted-foreground">
							If you were charged, please contact the parish office with the reference above.
						</p>
					</>
				)}

				<div className="flex flex-col sm:flex-row gap-2 pt-2">
					<Button asChild variant="outline" className="flex-1">
						<Link href="/">
							<ArrowLeft className="mr-2 h-4 w-4" /> Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
