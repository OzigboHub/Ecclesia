"use client";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
export const contactSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Enter a valid email"),
	phone: z.string().optional().or(z.literal("")),
	subject: z.string().min(1, "Subject is required"),
	message: z.string().min(10, "Message should be at least 10 characters"),
});

export type ContactValues = z.infer<typeof contactSchema>;

export default function Contact() {
	const form = useForm<ContactValues>({
		defaultValues: {
			email: "",
			firstName: "",
			lastName: "",
			message: "",
			phone: "",
			subject: "",
		},
		resolver: zodResolver(contactSchema),
		mode: "onChange",
	});
	const onSubmit = async (values: ContactValues) => {
		console.log({ values });
		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			});

			const data = await res.json();

			if (!res.ok) {
				if (data?.errors) {
					Object.entries(data.errors).forEach(([field, messages]) => {
						form.setError(field as keyof ContactValues, {
							type: "server",
							message: (messages as string[])?.[0],
						});
					});
				}

				throw new Error(data?.error ?? "Failed to send message");
			}

			toast.success("Message sent successfully.");
			form.reset();
		} catch (error) {
			console.error("Email failed", error);
			toast.error("Failed to send message. Please try again.");
		}
	};
	return (
		<div className="flex flex-col gap-12 px-4 py-[100px] sm:px-6 lg:px-8">
			<section className="flex flex-col gap-6">
				<div className="space-y-3">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
						Contact us
					</p>
					<h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
						We would love to hear from you
					</h1>
					<p className="text-sm text-muted-foreground md:text-base">
						Reach out for parish inquiries, sacraments,
						appointments, or community support. Our office team
						responds within 24 hours on business days.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row">
					<Button asChild className="w-full sm:w-auto">
						<a href="mailto:hello@ecclesia.ng">Send an email</a>
					</Button>
				</div>
			</section>

			{/* <section className="grid gap-4 md:grid-cols-2">
				<div className="rounded-2xl border bg-card p-5 shadow-sm">
					<div className="flex items-start gap-3">
						<span className="rounded-full bg-primary/10 p-2 text-primary">
							<MapPin className="h-5 w-5" />
						</span>
						<div className="space-y-1">
							<h3 className="text-base font-semibold">
								Visit the parish
							</h3>
							<p className="text-sm text-muted-foreground">
								12 Basilica Road, Enugu, Nigeria
							</p>
							<p className="text-sm text-muted-foreground">
								Landmark: St. Peter&apos;s Roundabout
							</p>
							<Button asChild variant="link" className="px-0">
								<a
									href="https://maps.google.com/?q=12%20Basilica%20Road%20Enugu"
									target="_blank"
									rel="noreferrer"
								>
									Get directions
								</a>
							</Button>
						</div>
					</div>
				</div>
				<div className="rounded-2xl border bg-card p-5 shadow-sm">
					<div className="flex items-start gap-3">
						<span className="rounded-full bg-primary/10 p-2 text-primary">
							<Clock className="h-5 w-5" />
						</span>
						<div className="space-y-1">
							<h3 className="text-base font-semibold">
								Office hours
							</h3>
							<p className="text-sm text-muted-foreground">
								Monday - Friday: 9:00 AM - 5:00 PM
							</p>
							<p className="text-sm text-muted-foreground">
								Saturday: 9:00 AM  1:00 PM
							</p>
							<p className="text-sm text-muted-foreground">
								Sunday: After 8:00 AM Mass
							</p>
						</div>
					</div>
				</div>
			</section> */}

			<section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
				<div className="rounded-2xl border bg-card p-6 shadow-sm">
					<div className="space-y-2">
						<h2 className="text-xl font-semibold">
							Send a message
						</h2>
						<p className="text-sm text-muted-foreground">
							Share your request and our team will follow up
							promptly.
						</p>
					</div>
					<Form {...form}>
						<form
							className="mt-6 grid gap-4"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									name="firstName"
									control={form.control}
									render={({ field }) => {
										return (
											<FormItem>
												<FormLabel>
													First name
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Chioma"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
								<FormField
									name="lastName"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last name</FormLabel>
											<FormControl>
												<Input
													placeholder="Okafor"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									name="email"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email address</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="chioma@gmail.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="phone"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone</FormLabel>
											<FormControl>
												<Input
													type="tel"
													placeholder="+234 80 1234 5678"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								name="subject"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Subject</FormLabel>
										<FormControl>
											<Input
												placeholder="Sacrament appointment"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="message"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Message</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Tell us how we can help..."
												rows={6}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-xs text-muted-foreground">
									We&apos;ll never share your contact details.
								</p>
								<Button
									type="submit"
									disabled={form.formState.isSubmitting}
								>
									{form.formState.isSubmitting ?
										"Sending..."
									:	"Send message"}
								</Button>
							</div>
						</form>
					</Form>
				</div>
				<div className="flex flex-col gap-4">
					<div className="rounded-2xl border bg-card p-5 shadow-sm">
						<div className="flex items-start gap-3">
							<span className="rounded-full bg-primary/10 p-2 text-primary">
								<Phone className="h-5 w-5" />
							</span>
							<div className="space-y-1">
								<h3 className="text-base font-semibold">
									Phone
								</h3>
								<p className="text-sm text-muted-foreground">
									+234 905 346 5422
								</p>
								<p className="text-sm text-muted-foreground">
									+234 809 065 1397
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-2xl border bg-card p-5 shadow-sm">
						<div className="flex items-start gap-3">
							<span className="rounded-full bg-primary/10 p-2 text-primary">
								<Mail className="h-5 w-5" />
							</span>
							<div className="space-y-1">
								<h3 className="text-base font-semibold">
									Email
								</h3>
								<p className="text-sm text-muted-foreground">
									ecclesialight@gmail.com
								</p>
								<p className="text-sm text-muted-foreground">
									support@ecclesialight.com
								</p>

								<Button asChild variant="link" className="px-0">
									<a href="mailto:support@ecclesialight.com">
										Start an email
									</a>
								</Button>
							</div>
						</div>
					</div>
					<div className="rounded-2xl border bg-card p-5 shadow-sm">
						<div className="space-y-2">
							<h3 className="text-base font-semibold">
								Quick links
							</h3>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link
										className="hover:text-foreground"
										href="/mass-schedule"
									>
										Mass schedule
									</Link>
								</li>
								<li>
									<Link
										className="hover:text-foreground"
										href="/contact"
									>
										Book an appointment
									</Link>
								</li>
								<li>
									<Link
										className="hover:text-foreground"
										href="/p"
									>
										Parish announcements
									</Link>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
