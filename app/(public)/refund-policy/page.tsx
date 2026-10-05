import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ShieldCheck } from "lucide-react";

export const metadata = {
	title: "Refund & Cancellation Policy | Ecclesia",
	description: "Refund and cancellation terms for Ecclesia subscriptions, parish dues, donations, and Mass intention stipends.",
};

export default function RefundPolicy() {
	const lastUpdated = "October 5, 2026";

	return (
		<div className="flex flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto">
			<section className="space-y-4 text-center sm:text-left">
				<Badge variant="secondary" className="inline-flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-primary" />
					Merchant Transparency
				</Badge>
				<h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
					Refund & Cancellation Policy
				</h1>
				<p className="text-sm text-muted-foreground">
					Last Updated: {lastUpdated}
				</p>
			</section>

			<div className="prose dark:prose-invert max-w-none space-y-8 text-foreground">
				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
						<RefreshCw className="h-5 w-5 text-primary" />
						1. Overview
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						At Ecclesia (EcclesiaLight), we strive to deliver a reliable, secure, and transparent digital parish management experience. This policy outlines the terms governing subscription cancellations, fee refunds, Mass intention stipends, society dues, and voluntary parish donations.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						2. SaaS Subscription Cancellations & Refunds
					</h2>
					<div className="text-sm leading-relaxed text-muted-foreground space-y-3">
						<ul className="list-disc pl-5 space-y-2">
							<li>
								<strong>Cancellation Any Time:</strong> Parish administrators may cancel their Ecclesia software subscription plan at any time through the billing dashboard or by emailing <a href="mailto:support@ecclesialight.com" className="text-primary hover:underline">support@ecclesialight.com</a>.
							</li>
							<li>
								<strong>Effective Date:</strong> Upon cancellation, your subscription will remain active until the end of the current paid billing cycle (monthly or annual). No further automatic charges will be processed.
							</li>
							<li>
								<strong>7-Day Money-Back Guarantee:</strong> New parish subscribers on paid tiers (e.g. Advanced Tier) are eligible for a full 100% refund of their initial subscription fee if requested within seven (7) calendar days of the initial subscription purchase.
							</li>
							<li>
								<strong>Prorated Refunds:</strong> Mid-cycle cancellations after the 7-day initial window are non-refundable for the remaining days of that billing period, but service remains active until period expiry.
							</li>
						</ul>
					</div>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						3. Mass Intention Stipends & Offerings
					</h2>
					<div className="text-sm leading-relaxed text-muted-foreground space-y-2">
						<p>
							Stipends associated with Mass Intention bookings are handled under liturgical guidelines:
						</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>Mass intention requests can be modified or rescheduled up to 48 hours prior to the scheduled Mass date by contacting the parish office.</li>
							<li>Stipends are non-refundable once the Mass has been celebrated or scheduled within 24 hours of celebration.</li>
							<li>If a Mass is cancelled by the parish due to emergency priest unavailability, the stipend will be rescheduled to another date or refunded upon request.</li>
						</ul>
					</div>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						4. Donations, Tithes & Society Dues
					</h2>
					<div className="text-sm leading-relaxed text-muted-foreground space-y-2">
						<p>
							Voluntary gifts, tithes, campaign contributions, and church society dues paid through Ecclesia are processed directly for parish ministry work:
						</p>
						<ul className="list-disc pl-5 space-y-1">
							<li><strong>General Policy:</strong> Voluntary donations and tithes are generally non-refundable.</li>
							<li><strong>Erroneous or Duplicate Transactions:</strong> If a donation or payment was processed in error due to a technical glitch, double charge, or wrong amount typed, please notify us within five (5) business days. Full refunds for duplicate charges will be issued back to the originating bank account or card.</li>
						</ul>
					</div>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						5. Refund Processing Timelines
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Approved refunds are processed via our payment processors (Paystack / Flutterwave) back to the original method of payment. Processing times typically take <strong>3 to 7 business days</strong> depending on your financial institution.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						6. Contact Support for Refund Enquiries
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground mb-4">
						To request a refund or raise a billing inquiry, please reach out with your transaction reference ID:
					</p>
					<div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
						<p className="font-semibold text-foreground">Ecclesia Billing Support</p>
						<p>Email: <a href="mailto:support@ecclesialight.com" className="text-primary hover:underline">support@ecclesialight.com</a> | <a href="mailto:ecclesialight@gmail.com" className="text-primary hover:underline">ecclesialight@gmail.com</a></p>
						<p>Phone: +234 905 346 5422 | +234 809 065 1397</p>
					</div>
				</section>
			</div>
		</div>
	);
}
