import Link from "next/link";
import {
	ArrowRight,
	Church,
	Play,
	Calendar,
	Heart,
	MapPin,
	Clock,
	Radio,
	ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
	getPublicLiveStreams,
	getPublicUpcomingEvents,
	getPublicActiveCampaigns,
} from "@/app/actions/public.actions";

export default async function LandingPage() {
	const [streamsResult, eventsResult, campaignsResult] = await Promise.all([
		getPublicLiveStreams(),
		getPublicUpcomingEvents(),
		getPublicActiveCampaigns(),
	]);

	const streams = streamsResult.data || [];
	const events = eventsResult.data || [];
	const campaigns = campaignsResult.data || [];

	const hasLiveNow = streams.some(
		(s: any) => s.isLive === true
	);

	const formatDate = (dateStr: string) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	const formatTime = (dateStr: string) => {
		const d = new Date(dateStr);
		return d.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Hero — quick access */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
				<div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
					<div className="mx-auto max-w-3xl text-center">
						<h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
							Welcome to{" "}
							<span className="text-primary">Ecclesia</span>
						</h1>
						<p className="mt-4 text-lg text-muted-foreground md:text-xl">
							Watch live Mass, stay updated on events, and
							support your parish — all in one place.
						</p>
						<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
							{hasLiveNow ? (
								<Button asChild size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
									<a href="#live">
										<Play className="mr-2 h-4 w-4" />
										Watch Live
									</a>
								</Button>
							) : streams.length > 0 ? (
								<Button asChild size="lg" className="w-full sm:w-auto">
									<a href="#live">
										<Play className="mr-2 h-4 w-4" />
										Upcoming Streams
									</a>
								</Button>
							) : null}
							{campaigns.length > 0 && (
								<Button
									asChild
									size="lg"
									variant={hasLiveNow ? "outline" : "default"}
									className="w-full sm:w-auto"
								>
									<a href="#give">
										<Heart className="mr-2 h-4 w-4" />
										Donate Now
									</a>
								</Button>
							)}
							{events.length > 0 && (
								<Button
									asChild
									variant="outline"
									size="lg"
									className="w-full sm:w-auto"
								>
									<a href="#events">
										<Calendar className="mr-2 h-4 w-4" />
										View Events
									</a>
								</Button>
							)}
							{/* Guest access button */}
							<Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
								<Link href="/p">Guest</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Live Streams */}
			{streams.length > 0 && (
				<section id="live" className="scroll-mt-16 border-t bg-muted/30">
					<div className="mx-auto max-w-6xl px-4 py-16">
						<div className="flex items-center gap-3 mb-8">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
								<Radio className="h-5 w-5 text-red-600" />
							</div>
							<div>
								<h2 className="text-2xl font-bold">
									{hasLiveNow ? "Live Now" : "Upcoming Streams"}
								</h2>
								<p className="text-sm text-muted-foreground">
									Watch from anywhere
								</p>
							</div>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							{streams.map((stream: any) => (
								<a
									key={stream.id}
									href={stream.streamUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/30"
								>
									<div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${stream.isLive
											? "bg-red-100 dark:bg-red-900/30"
											: "bg-primary/10"
										}`}>
										<Play className={`h-6 w-6 ${stream.isLive ? "text-red-600" : "text-primary"
											}`} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold truncate">
												{stream.title}
											</h3>
											{stream.isLive && (
												<span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
													LIVE
												</span>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{stream.organization?.name} · {formatDate(stream.scheduledFor)} at {formatTime(stream.scheduledFor)}
										</p>
									</div>
									<ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
								</a>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Events */}
			{events.length > 0 && (
				<section id="events" className="scroll-mt-16 border-t">
					<div className="mx-auto max-w-6xl px-4 py-16">
						<div className="flex items-center gap-3 mb-8">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Calendar className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h2 className="text-2xl font-bold">Upcoming Events</h2>
								<p className="text-sm text-muted-foreground">
									Stay connected with your parish
								</p>
							</div>
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{events.map((event: any) => (
								<div
									key={event.id}
									className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
											<span className="text-xs font-medium uppercase">
												{new Date(event.startTime).toLocaleDateString("en-US", { month: "short" })}
											</span>
											<span className="text-lg font-bold leading-none">
												{new Date(event.startTime).getDate()}
											</span>
										</div>
									</div>
									<h3 className="mt-3 font-semibold">{event.title}</h3>
									{event.description && (
										<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
											{event.description}
										</p>
									)}
									<div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
										<span className="flex items-center gap-1">
											<Clock className="h-3.5 w-3.5" />
											{formatTime(event.startTime)}
										</span>
										{event.location && (
											<span className="flex items-center gap-1">
												<MapPin className="h-3.5 w-3.5" />
												{event.location}
											</span>
										)}
									</div>
									<p className="mt-2 text-xs text-muted-foreground/70">
										{event.organization?.name}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Campaigns / Donate */}
			{campaigns.length > 0 && (
				<section id="give" className="scroll-mt-16 border-t bg-muted/30">
					<div className="mx-auto max-w-6xl px-4 py-16">
						<div className="flex items-center gap-3 mb-8">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
								<Heart className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<h2 className="text-2xl font-bold">Support Your Parish</h2>
								<p className="text-sm text-muted-foreground">
									Every contribution makes a difference
								</p>
							</div>
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{campaigns.map((campaign: any) => (
								<div
									key={campaign.id}
									className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
								>
									<h3 className="font-semibold">{campaign.name}</h3>
									{campaign.description && (
										<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
											{campaign.description}
										</p>
									)}
									<div className="mt-4">
										<div className="flex justify-between text-sm mb-1.5">
											<span className="font-medium text-green-700 dark:text-green-400">
												{formatCurrency(campaign.raisedAmount)} raised
											</span>
											<span className="text-muted-foreground">
												of {formatCurrency(campaign.targetAmount)}
											</span>
										</div>
										<div className="h-2 w-full rounded-full bg-muted">
											<div
												className="h-2 rounded-full bg-green-500 transition-all"
												style={{ width: `${Math.min(100, campaign.progress)}%` }}
											/>
										</div>
										<p className="mt-1 text-xs text-muted-foreground">
											{Math.round(campaign.progress)}% of goal
										</p>
									</div>
									<Button
										asChild
										className="mt-4 w-full"
										size="sm"
									>
										<Link href={`/donate/${campaign.id}`}>
											<Heart className="mr-1.5 h-3.5 w-3.5" />
											Donate
										</Link>
									</Button>
									<p className="mt-2 text-xs text-center text-muted-foreground/70">
										{campaign.organization?.name}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Empty state — when no public content exists at all */}
			{streams.length === 0 && events.length === 0 && campaigns.length === 0 && (
				<section className="border-t">
					<div className="mx-auto max-w-6xl px-4 py-20">
						<div className="mx-auto max-w-2xl text-center">
							<Church className="mx-auto h-12 w-12 text-muted-foreground/40" />
							<h2 className="mt-4 text-2xl font-semibold">
								Welcome to Ecclesia
							</h2>
							<p className="mt-2 text-muted-foreground">
								Parish management, simplified. Manage
								parishioners, track finances, coordinate mass
								intentions, and more.
							</p>
							<div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
								<Button asChild>
									<Link href="/auth/login">
										Login
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
