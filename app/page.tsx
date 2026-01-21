'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
	Users,
	Wallet,
	Church,
	Calendar,
	BookOpen,
	Shield,
	Building2,
	CheckCircle2,
	ArrowRight,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function LandingPage() {
	const [formData, setFormData] = useState({
		parishName: '',
		contactName: '',
		email: '',
		phone: '',
		message: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [openFaq, setOpenFaq] = useState<number | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		// Simulate submission - replace with actual API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setIsSubmitting(false);
		setIsSubmitted(true);
	};

	const features = [
		{
			icon: Users,
			title: 'Parishioner Management',
			description:
				'Maintain complete member profiles with contact details, family connections, and membership history. Search and filter across your entire community.',
		},
		{
			icon: Wallet,
			title: 'Financial Record Keeping',
			description:
				'Record offerings, tithes, and donations with multiple payment methods. Monitor contributions by member and generate receipts for transparency.',
		},
		{
			icon: Church,
			title: 'Mass Intentions',
			description:
				'Accept and manage mass intention requests with an organized booking system. Track intention types, dates, and payment status in one view.',
		},
		{
			icon: Calendar,
			title: 'Appointments',
			description:
				'Schedule pastoral visits, counseling sessions, and sacramental preparations. Manage availability and reduce scheduling conflicts.',
		},
		{
			icon: BookOpen,
			title: 'Sacramental Records',
			description:
				'Maintain permanent records of baptisms, confirmations, marriages, and other sacraments. Generate official certificates when needed.',
		},
		{
			icon: Building2,
			title: 'Multi-Location Support',
			description:
				'Manage your main parish and outstations from one system. Each location maintains its own data while you get the complete picture.',
		},
	];

	const steps = [
		{
			number: '01',
			title: 'Request a Demo',
			description:
				"Tell us about your parish and we'll schedule a personalized walkthrough.",
		},
		{
			number: '02',
			title: 'Setup Your Parish',
			description:
				'We help you configure your parish structure, user roles, and initial data.',
		},
		{
			number: '03',
			title: 'Start Managing',
			description:
				'Your team begins using Ecclesia for daily parish administration.',
		},
	];

	const faqs = [
		{
			question: 'Is our parish data kept separate from other parishes?',
			answer: 'Yes. Every parish operates in its own secure environment. Your data is completely isolated and only accessible to your authorized staff members.',
		},
		{
			question: 'Can we manage outstations alongside our main parish?',
			answer: 'Absolutely. Ecclesia supports parish-to-outstation hierarchies. You can view consolidated reports or drill down into individual locations.',
		},
		{
			question: 'Who in our parish can access the system?',
			answer: 'You control access. Ecclesia supports multiple roles—from parish administrators with full access to staff members with limited permissions. Each person sees only what they need.',
		},
		{
			question: 'What if we only need some features?',
			answer: "Ecclesia is modular. Enable the features you need now and add more as your parish grows. You're not paying for or navigating features you don't use.",
		},
	];

	return (
		<div className='min-h-screen bg-background'>
			{/* Navigation */}
			<nav className='sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
				<div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-4'>
					<div className='flex items-center gap-2'>
						<Church className='h-8 w-8 text-primary' />
						<span className='text-xl font-bold'>Ecclesia</span>
					</div>
					<div className='flex items-center gap-4'>
						<Link
							href='/auth/login'
							className='text-sm text-muted-foreground hover:text-foreground'
						>
							Sign In
						</Link>
						<Button
							asChild
							size='sm'
						>
							<a href='#demo'>Request Demo</a>
						</Button>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className='relative overflow-hidden'>
				<div className='absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background' />
				<div className='mx-auto max-w-6xl px-4 py-20 md:py-32'>
					<div className='mx-auto max-w-3xl text-center'>
						<h1 className='text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl'>
							Parish management,{' '}
							<span className='text-primary'>simplified</span>
						</h1>
						<p className='mt-6 text-lg text-muted-foreground md:text-xl'>
							Manage parishioners, track finances, coordinate mass
							intentions, schedule appointments, and maintain
							sacramental records—all in one secure system built
							for how parishes actually work.
						</p>
						<div className='mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center'>
							<Button
								asChild
								size='lg'
								className='w-full sm:w-auto'
							>
								<a href='#demo'>
									Request a Demo
									<ArrowRight className='ml-2 h-4 w-4' />
								</a>
							</Button>
							<Button
								asChild
								variant='outline'
								size='lg'
								className='w-full sm:w-auto'
							>
								<a href='#features'>See Features</a>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Problem Statement */}
			<section className='border-y bg-muted/30'>
				<div className='mx-auto max-w-6xl px-4 py-16'>
					<div className='mx-auto max-w-3xl text-center'>
						<h2 className='text-2xl font-semibold md:text-3xl'>
							Spreadsheets weren&apos;t built for parish work
						</h2>
						<p className='mt-4 text-muted-foreground'>
							Tracking members across notebooks, chasing payment
							records in Excel, and coordinating schedules through
							phone calls takes time away from ministry. Ecclesia
							brings it together so your team can focus on what
							matters.
						</p>
					</div>
				</div>
			</section>

			{/* Features */}
			<section
				id='features'
				className='scroll-mt-16'
			>
				<div className='mx-auto max-w-6xl px-4 py-20'>
					<div className='text-center'>
						<h2 className='text-3xl font-bold md:text-4xl'>
							Everything your parish office needs
						</h2>
						<p className='mt-4 text-muted-foreground'>
							Core tools for daily parish administration, designed
							to work together.
						</p>
					</div>
					<div className='mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
						{features.map((feature) => (
							<div
								key={feature.title}
								className='rounded-lg border bg-card p-6 transition-shadow hover:shadow-md'
							>
								<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
									<feature.icon className='h-6 w-6 text-primary' />
								</div>
								<h3 className='mt-4 text-lg font-semibold'>
									{feature.title}
								</h3>
								<p className='mt-2 text-sm text-muted-foreground'>
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Trust / Differentiators */}
			<section className='border-y bg-muted/30'>
				<div className='mx-auto max-w-6xl px-4 py-16'>
					<div className='grid gap-8 md:grid-cols-3'>
						<div className='flex items-start gap-4'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10'>
								<Shield className='h-5 w-5 text-primary' />
							</div>
							<div>
								<h3 className='font-semibold'>
									Role-Based Access
								</h3>
								<p className='mt-1 text-sm text-muted-foreground'>
									Eight distinct roles from Parish Admin to
									Parishioner. Everyone sees only what they
									should.
								</p>
							</div>
						</div>
						<div className='flex items-start gap-4'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10'>
								<Building2 className='h-5 w-5 text-primary' />
							</div>
							<div>
								<h3 className='font-semibold'>
									Organization Scoped
								</h3>
								<p className='mt-1 text-sm text-muted-foreground'>
									Parish data stays with your parish.
									Outstations can operate independently or
									roll up to the main parish.
								</p>
							</div>
						</div>
						<div className='flex items-start gap-4'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10'>
								<CheckCircle2 className='h-5 w-5 text-primary' />
							</div>
							<div>
								<h3 className='font-semibold'>
									Modular Features
								</h3>
								<p className='mt-1 text-sm text-muted-foreground'>
									Enable what you need. Turn on additional
									modules—like SMS notifications or online
									payments—when you&apos;re ready.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className='scroll-mt-16'>
				<div className='mx-auto max-w-6xl px-4 py-20'>
					<div className='text-center'>
						<h2 className='text-3xl font-bold md:text-4xl'>
							Get started in three steps
						</h2>
						<p className='mt-4 text-muted-foreground'>
							We make onboarding simple so you can start seeing
							results quickly.
						</p>
					</div>
					<div className='mt-16 grid gap-8 md:grid-cols-3'>
						{steps.map((step, index) => (
							<div
								key={step.number}
								className='relative text-center'
							>
								{index < steps.length - 1 && (
									<div className='absolute left-1/2 top-8 hidden h-0.5 w-full bg-border md:block' />
								)}
								<div className='relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground'>
									{step.number}
								</div>
								<h3 className='mt-4 text-lg font-semibold'>
									{step.title}
								</h3>
								<p className='mt-2 text-sm text-muted-foreground'>
									{step.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className='border-t bg-muted/30'>
				<div className='mx-auto max-w-3xl px-4 py-20'>
					<div className='text-center'>
						<h2 className='text-3xl font-bold md:text-4xl'>
							Common questions
						</h2>
					</div>
					<div className='mt-12 space-y-4'>
						{faqs.map((faq, index) => (
							<div
								key={index}
								className='rounded-lg border bg-card'
							>
								<button
									onClick={() =>
										setOpenFaq(
											openFaq === index ? null : index
										)
									}
									className='flex w-full items-center justify-between p-4 text-left'
								>
									<span className='font-medium'>
										{faq.question}
									</span>
									{openFaq === index ? (
										<ChevronUp className='h-5 w-5 shrink-0 text-muted-foreground' />
									) : (
										<ChevronDown className='h-5 w-5 shrink-0 text-muted-foreground' />
									)}
								</button>
								{openFaq === index && (
									<div className='border-t px-4 py-3'>
										<p className='text-sm text-muted-foreground'>
											{faq.answer}
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Demo Form */}
			<section
				id='demo'
				className='scroll-mt-16 border-t'
			>
				<div className='mx-auto max-w-6xl px-4 py-20'>
					<div className='mx-auto max-w-xl'>
						<div className='text-center'>
							<h2 className='text-3xl font-bold md:text-4xl'>
								Request a demo
							</h2>
							<p className='mt-4 text-muted-foreground'>
								Tell us about your parish and we&apos;ll
								schedule a personalized walkthrough of Ecclesia.
							</p>
						</div>

						{isSubmitted ? (
							<div className='mt-12 rounded-lg border bg-card p-8 text-center'>
								<div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
									<CheckCircle2 className='h-8 w-8 text-green-600 dark:text-green-400' />
								</div>
								<h3 className='mt-4 text-xl font-semibold'>
									Thank you for your interest!
								</h3>
								<p className='mt-2 text-muted-foreground'>
									We&apos;ve received your request and will be
									in touch within 1-2 business days to
									schedule your demo.
								</p>
							</div>
						) : (
							<form
								onSubmit={handleSubmit}
								className='mt-12 space-y-6'
							>
								<div className='grid gap-6 sm:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='parishName'>
											Parish Name *
										</Label>
										<Input
											id='parishName'
											required
											placeholder="St. Mary's Catholic Church"
											value={formData.parishName}
											onChange={(e) =>
												setFormData({
													...formData,
													parishName: e.target.value,
												})
											}
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='contactName'>
											Your Name *
										</Label>
										<Input
											id='contactName'
											required
											placeholder='Fr. John Smith'
											value={formData.contactName}
											onChange={(e) =>
												setFormData({
													...formData,
													contactName: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<div className='grid gap-6 sm:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='email'>
											Email Address *
										</Label>
										<Input
											id='email'
											type='email'
											required
											placeholder='parish@example.com'
											value={formData.email}
											onChange={(e) =>
												setFormData({
													...formData,
													email: e.target.value,
												})
											}
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='phone'>
											Phone Number
										</Label>
										<Input
											id='phone'
											type='tel'
											placeholder='+234 800 000 0000'
											value={formData.phone}
											onChange={(e) =>
												setFormData({
													...formData,
													phone: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='message'>
										Tell us about your parish (optional)
									</Label>
									<Textarea
										id='message'
										rows={4}
										placeholder='Number of parishioners, outstations, current challenges...'
										value={formData.message}
										onChange={(e) =>
											setFormData({
												...formData,
												message: e.target.value,
											})
										}
									/>
								</div>
								<Button
									type='submit'
									size='lg'
									className='w-full'
									disabled={isSubmitting}
								>
									{isSubmitting
										? 'Submitting...'
										: 'Request Demo'}
								</Button>
								<p className='text-center text-xs text-muted-foreground'>
									We&apos;ll respond within 1-2 business days.
									No spam, ever.
								</p>
							</form>
						)}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='border-t bg-muted/30'>
				<div className='mx-auto max-w-6xl px-4 py-12'>
					<div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
						<div className='flex items-center gap-2'>
							<Church className='h-6 w-6 text-primary' />
							<span className='font-semibold'>Ecclesia</span>
						</div>
						<div className='flex gap-6 text-sm text-muted-foreground'>
							<a
								href='mailto:hello@ecclesia.app'
								className='hover:text-foreground'
							>
								Contact
							</a>
							<Link
								href='/privacy'
								className='hover:text-foreground'
							>
								Privacy
							</Link>
							<Link
								href='/terms'
								className='hover:text-foreground'
							>
								Terms
							</Link>
						</div>
						<p className='text-sm text-muted-foreground'>
							© {new Date().getFullYear()} Ecclesia. All rights
							reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
