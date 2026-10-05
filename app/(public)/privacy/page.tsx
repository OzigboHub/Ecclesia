import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldCheck } from "lucide-react";

export const metadata = {
	title: "Privacy Policy | Ecclesia",
	description: "Privacy Policy explaining how Ecclesia protects personal data for Catholic parishes and parishioners.",
};

export default function PrivacyPolicy() {
	const lastUpdated = "October 5, 2026";

	return (
		<div className="flex flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto">
			<section className="space-y-4 text-center sm:text-left">
				<Badge variant="secondary" className="inline-flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-primary" />
					Data Protection & Privacy Compliance
				</Badge>
				<h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
					Privacy Policy
				</h1>
				<p className="text-sm text-muted-foreground">
					Last Updated: {lastUpdated}
				</p>
			</section>

			<div className="prose dark:prose-invert max-w-none space-y-8 text-foreground">
				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
						<Lock className="h-5 w-5 text-primary" />
						1. Introduction
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Ecclesia (&quot;EcclesiaLight&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting the personal data of parish administrators, clergy, parishioners, and donors. This Privacy Policy details how we collect, use, store, share, and protect your information when you interact with our platform.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						2. Information We Collect
					</h2>
					<div className="text-sm leading-relaxed text-muted-foreground space-y-3">
						<p>We collect information necessary to facilitate digital parish operations and parishioner engagement:</p>
						<ul className="list-disc pl-5 space-y-2">
							<li>
								<strong>Account & Profile Information:</strong> Full names, email addresses, phone numbers, home addresses, and organization/parish affiliations.
							</li>
							<li>
								<strong>Parish & Sacramental Metadata:</strong> Mass intentions, appointment scheduling preferences, society memberships, and parishioner directory entries managed by designated parish admins.
							</li>
							<li>
								<strong>Payment & Financial Transaction Metadata:</strong> When paying subscription fees, Mass intention stipends, tithes, or donations, transaction details (amount, payment status, reference IDs, billing name) are recorded. Card numbers and banking details are processed directly by our secure PCI-DSS compliant payment gateways (e.g. Paystack / Flutterwave).
							</li>
							<li>
								<strong>Technical & Usage Log Data:</strong> IP addresses, browser types, operating system details, device identifiers, and session timestamps collected to ensure system security and optimize application speed.
							</li>
						</ul>
					</div>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						3. How We Use Your Information
					</h2>
					<ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-2">
						<li>To deliver, maintain, and enhance the Ecclesia Digital Parish Management features.</li>
						<li>To process subscriptions, dues, tithes, and Mass intention requests securely.</li>
						<li>To issue administrative notices, receipt confirmations, and parish communication updates.</li>
						<li>To protect against fraud, unauthorized system access, or illegal activities.</li>
						<li>To satisfy applicable legal and regulatory reporting obligations (NDPR / GDPR framework alignment).</li>
					</ul>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						4. Data Sharing & Third-Party Processors
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						We <strong>never sell or rent</strong> personal data to advertisers or third parties. We share data only with trusted service providers necessary to operate the platform:
					</p>
					<ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
						<li><strong>Payment Gateways:</strong> Paystack and Flutterwave for processing secure digital payments.</li>
						<li><strong>Cloud Infrastructure & Database Hosting:</strong> Secure hosting environments with encrypted database storage (e.g. Neon PostgreSQL, Next.js hosting).</li>
						<li><strong>Messaging Services:</strong> SMS and Email dispatch providers for transaction alerts and parish notifications.</li>
					</ul>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						5. Data Security & Storage
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						We implement robust administrative, technical, and physical security measures including SSL/TLS encryption for all data in transit, strict multi-tenant database scoping by organization ID, role-based access control, and hashed password authentication.
					</p>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						6. Your Rights & Choices
					</h2>
					<div className="text-sm leading-relaxed text-muted-foreground space-y-2">
						<p>Depending on your jurisdiction, you possess the right to:</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>Access, review, or export personal data held in your profile.</li>
							<li>Request correction of inaccurate or incomplete records.</li>
							<li>Request account deletion and data erasure, subject to mandatory record-keeping requirements for financial transactions.</li>
						</ul>
					</div>
				</section>

				<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
					<h2 className="text-xl font-semibold text-foreground">
						7. Contact Our Privacy Team
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground mb-4">
						If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact our Privacy Team:
					</p>
					<div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
						<p className="font-semibold text-foreground">Ecclesia Privacy Office</p>
						<p>Email: <a href="mailto:support@ecclesialight.com" className="text-primary hover:underline">support@ecclesialight.com</a> | <a href="mailto:ecclesialight@gmail.com" className="text-primary hover:underline">ecclesialight@gmail.com</a></p>
						<p>Phone: +234 905 346 5422 | +234 809 065 1397</p>
					</div>
				</section>
			</div>
		</div>
	);
}
