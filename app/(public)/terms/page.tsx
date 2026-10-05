import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileText } from "lucide-react";

export const metadata = {
	title: "Terms of Service | Ecclesia",
	description: "Terms of Service and conditions for using the Ecclesia Digital Parish Management platform.",
};

export default function TermsOfService() {
	const lastUpdated = "October 5, 2026";

	return (
		<div className="flex flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto">
			<section className="space-y-4 text-center sm:text-left">
				<Badge variant="secondary" className="inline-flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-primary" />
					Legal Compliance & Governance
				</Badge>
				<h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
					Terms of Service
				</h1>
				<p className="text-sm text-muted-foreground">
					Last Updated: {lastUpdated}
				</p>
			</section>

			<div className="prose dark:prose-invert max-w-none space-y-8 text-foreground">
				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
						<FileText className="h-5 w-5 text-primary" />
						1. Agreement to Terms
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						By accessing or using the Ecclesia platform (accessible via our web application and related services, operated under EcclesiaLight), you agree to be bound by these Terms of Service. If you are accepting these terms on behalf of a parish, diocese, outstation, or organization, you represent that you have full authority to bind that entity to these terms.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						2. Description of Platform Services
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Ecclesia provides a Digital Parish Management (DPM) software-as-a-service (SaaS) platform tailored for Catholic parishes and dioceses. Our services include parishioner directory management, Mass intention logging, appointment scheduling, society dues tracking, announcement broadcasting, live streaming links, and digital contribution/donation processing.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						3. Account Registration & Organization Administration
					</h2>
					<ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-2">
						<li>
							<strong>Parish Administrators:</strong> Administrative accounts must provide accurate, complete organizational details. Administrators are responsible for managing access permissions, role assignments, and feature toggles for their parish.
						</li>
						<li>
							<strong>Parishioners & Users:</strong> You are responsible for safeguarding your login credentials and for all activities that occur under your user account.
						</li>
						<li>
							<strong>Security:</strong> Notify us immediately at <a href="mailto:support@ecclesialight.com" className="text-primary hover:underline">support@ecclesialight.com</a> if you suspect any unauthorized access to your account.
						</li>
					</ul>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						4. Pricing, Subscriptions & Payment Terms
					</h2>
					<div className="text-sm leading-relaxed text-muted-foreground space-y-3">
						<p>
							Ecclesia offers subscription plans (Free, Advanced at ₦20,000/month, and Enterprise custom tiers) billed on a monthly or annual basis as specified during signup.
						</p>
						<ul className="list-disc pl-5 space-y-1">
							<li><strong>Billing Cycle:</strong> Subscriptions renew automatically at the end of each billing period unless cancelled prior to renewal.</li>
							<li><strong>Fees & Currency:</strong> All prices are listed in Nigerian Naira (₦ / NGN) unless explicitly quoted in another currency. Applicable taxes are included or itemized where required.</li>
							<li><strong>Online Payments:</strong> Payments processed through Ecclesia (including Mass intention stipends, society dues, tithes, and donations) are securely handled by licensed payment processors (e.g. Paystack / Flutterwave). Ecclesia does not store raw credit card credentials on its servers.</li>
						</ul>
					</div>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						5. Cancellation & Refund Policy
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Subscription cancellations and refunds are subject to our standalone <Link href="/refund-policy" className="text-primary underline font-medium">Refund & Cancellation Policy</Link>. SaaS subscriptions can be cancelled at any time, taking effect at the conclusion of the active billing period. Mass intention stipends and voluntary donations are generally non-refundable once scheduled or processed.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						6. User Conduct & Acceptable Use
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Users agree not to engage in unlawful conduct, attempt unauthorized access to parish data, upload harmful code, or misuse communication tools (SMS, email announcements) to spam or harass individuals. We reserve the right to suspend accounts violating these guidelines.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						7. Data Privacy & Confidentiality
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Your privacy is paramount. Collection and handling of parishioner record data, Sacramental records, and financial transaction metadata strictly follow our <Link href="/privacy" className="text-primary underline font-medium">Privacy Policy</Link>.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						8. Limitation of Liability & Contact Info
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground mb-4">
						To the maximum extent permitted by law, Ecclesia and its operators shall not be liable for indirect, incidental, or consequential damages arising from service downtime, data loss, or third-party payment gateway disruptions.
					</p>
					<div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
						<p className="font-semibold text-foreground">Ecclesia Support & Compliance</p>
						<p>Email: <a href="mailto:support@ecclesialight.com" className="text-primary hover:underline">support@ecclesialight.com</a> | <a href="mailto:ecclesialight@gmail.com" className="text-primary hover:underline">ecclesialight@gmail.com</a></p>
						<p>Phone: +234 905 346 5422 | +234 809 065 1397</p>
					</div>
				</section>
			</div>
		</div>
	);
}
