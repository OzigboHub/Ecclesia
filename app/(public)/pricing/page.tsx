"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

const tiers = [
	{
		name: "Free",
		price: "₦0",
		period: "per month",
		description: "Perfect for small outstations getting started.",
		cta: "Request a quote",
		href: "/auth/register",
		features: [
			"Parishioner directory",
			"Mass intention log",
			"Basic giving records",
			"Email support",
			"Mass Creation",
			"Book Mass Intention",
			"Live Streaming",
			"Donation Campaign",
		],
	},
	{
		name: "Advanced",
		price: "₦50,000",
		period: "per month",
		description: "Everything you need for a growing parish office.",
		cta: "Request a quote",
		href: "/auth/register",
		badge: "Most popular",
		features: [
			"Two-outstation oversight",
			"Advanced payments & pledges",
			"Appointments & scheduling",
			"Announcements & events",
			"Priority support",
			"Societies",
		],
	},
	{
		name: "Enterprise",
		price: "Custom",
		period: "annual agreement",
		description: "Tailored rollouts for multi-parish dioceses.",
		cta: "Request a quote",
		href: "/contact",
		features: [
			"Dedicated success manager",
			"Custom integrations",
			"Advanced reporting",
			"Training & onboarding",
		],
	},
];

const faqs = [
	{
		question: "Is there a free trial?",
		answer: "Yes. The Parish plan includes a 14-day free trial with full access and no credit card required.",
	},
	{
		question: "Can we migrate our existing records?",
		answer: "Absolutely. We provide CSV templates and hands-on support for larger migrations.",
	},
	{
		question: "What payment methods are supported?",
		answer: "Bank transfer, card payments, and direct debit are supported for Nigerian accounts.",
	},
];

export default function Pricing() {
	const [emailValue, setEmailValue] = useState("");
	const [subjectValue, setSubjectValue] = useState("");
	const [messageValue, setMMessageValue] = useState("");
	const [tierValue, setTierValue] = useState("");
	const [loading, setLoading] = useState(false);

	const onSubmit = async () => {
		const payload = {
			tier: tierValue,
			email: emailValue,
			subject: subjectValue,
			message: messageValue,
		};
		setLoading(true);
		try {
			const res = await fetch("/api/quotes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const data = await res.json();

			if (!res.ok) {
				if (data?.errors) {
					console.log(data.error);
				}

				throw new Error(data?.error ?? "Failed to send message");
			}

			toast.success("Message sent successfully.");
		} catch (error) {
			console.error("Email failed", error);
			toast.error("Failed to send message. Please try again.");
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className="flex flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
			<section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
				<Badge variant="secondary" className="flex items-center gap-2">
					<Sparkles className="h-4 w-4" />
					Trusted by Catholic parishes nationwide
				</Badge>
				<div className="space-y-3">
					<h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
						Flexible plans for every parish size
					</h1>
					<p className="text-sm text-muted-foreground md:text-base">
						Choose a plan that matches your pastoral needs today and
						scales as your ministry grows.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row">
					<Button asChild>
						<Link href="/auth/register">Start free trial</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/contact">Request a demo</Link>
					</Button>
				</div>
			</section>

			<section className="grid gap-6 lg:grid-cols-3">
				{tiers.map((tier) => (
					<div
						key={tier.name}
						className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm"
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">
									{tier.name}
								</h2>
								{tier.badge ?
									<Badge>{tier.badge}</Badge>
								:	null}
							</div>
							<p className="text-sm text-muted-foreground">
								{tier.description}
							</p>
							<div className="space-y-1">
								<p className="text-3xl font-semibold">
									{tier.price}
								</p>
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
									{tier.period}
								</p>
							</div>
						</div>
						<ul className="mt-6 space-y-3 text-sm text-muted-foreground">
							{tier.features.map((feature) => (
								<li
									key={feature}
									className="flex items-start gap-2"
								>
									<Check className="mt-0.5 h-4 w-4 text-primary" />
									<span>{feature}</span>
								</li>
							))}
						</ul>
						<Dialog
							onOpenChange={(open) => {
								if (open) {
									setSubjectValue(
										`Quote Request For ${tier.name} Tier`,
									);
									setTierValue(tier.name);
								}
							}}
						>
							<DialogTrigger asChild>
								<Button
									variant={tier.badge ? "default" : "outline"}
									className="mt-8"
								>
									{tier.cta}
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Request Quote?</DialogTitle>
									<DialogDescription>
										Send Ecclesia admins a quote regarding
										this pricing tier.
									</DialogDescription>
									<div className=" mt-[10px]">
										<Badge>{tier.name}</Badge>
										<div className=" flex gap-2 flex-col mt-[10px]">
											<Label>Email Address</Label>
											<Input
												value={emailValue}
												onChange={(e) =>
													setEmailValue(
														e.target.value,
													)
												}
												placeholder="Enter your email"
											/>
										</div>
										<div className=" flex gap-2 flex-col mt-[10px]">
											<Label>Subject</Label>
											<Input
												value={subjectValue}
												disabled
											/>
										</div>
										<div className=" flex gap-2 flex-col mt-[10px]">
											<Label>Message</Label>
											<Textarea
												value={messageValue}
												onChange={(e) =>
													setMMessageValue(
														e.target.value,
													)
												}
												placeholder="Start typing..."
												className=" h-[200px] resize-none"
											/>
										</div>
										<div className=" mt-[10px]">
											<Button
												onClick={onSubmit}
												disabled={loading}
												className=" w-full"
											>
												{loading ?
													"Submitting..."
												:	"Submit"}
											</Button>
										</div>
									</div>
								</DialogHeader>
							</DialogContent>
						</Dialog>
					</div>
				))}
			</section>

			<section className="grid gap-8 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
				<div className="space-y-3">
					<h2 className="text-2xl font-semibold">
						Need help choosing?
					</h2>
					<p className="text-sm text-muted-foreground">
						Our team will recommend the right plan based on your
						parish size, outstation coverage, and reporting needs.
					</p>
					<Button asChild>
						<Link href="/contact">Talk with our team</Link>
					</Button>
				</div>
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Frequently asked</h3>
					<div className="space-y-4">
						{faqs.map((faq) => (
							<div key={faq.question} className="space-y-2">
								<p className="text-sm font-semibold">
									{faq.question}
								</p>
								<p className="text-sm text-muted-foreground">
									{faq.answer}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
