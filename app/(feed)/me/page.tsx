import { getMemberProfile } from "@/app/actions/member.actions";
import { getPreferences } from "@/app/actions/preferences.actions";
import { auth } from "@/auth";
import { naira } from "@/components/feed/feed-card-shell";
import { FeedShell } from "@/components/feed/feed-shell";
import { SignedOutMe } from "@/components/feed/me/signed-out-me";
import { ThemeToggle } from "@/components/feed/chrome/theme-toggle";
import db from "@/lib/db";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Me · Ecclesia" };

export default async function MePage() {
	const [session, prefs, profile] = await Promise.all([
		auth(),
		getPreferences(),
		getMemberProfile(),
	]);

	const parish =
		prefs.organizationId ?
			await db.organization.findUnique({
				where: { id: prefs.organizationId },
				select: { id: true, name: true },
			})
		:	null;

	if (!session?.user || !profile.data) {
		return (
			<FeedShell topBar={<MeTopBar />}>
				<SignedOutMe
					organizationId={parish?.id ?? null}
					organizationName={parish?.name ?? "your parish"}
				/>
			</FeedShell>
		);
	}

	const me = profile.data;

	return (
		<FeedShell topBar={<MeTopBar />}>
			<header className="flex items-center gap-3.5 border-b border-hairline px-4 py-4">
				<span
					aria-hidden
					className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-title font-semibold text-gold"
				>
					{me.photoUrl ?
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={me.photoUrl}
							alt=""
							className="size-full object-cover"
						/>
					:	me.initials}
				</span>
				<div className="min-w-0">
					<h1 className="truncate text-title font-semibold text-fg">
						{me.name}
					</h1>
					<p className="mt-0.5 truncate text-meta text-fg-muted">
						{me.organizationName}
					</p>
				</div>
			</header>

			<Link
				href="/me/giving"
				className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3.5"
			>
				<span>
					<span className="block text-meta text-fg-dim">
						Given this year
					</span>
					<span className="mt-0.5 block text-title font-semibold tabular-nums text-fg">
						{naira(me.givenThisYear)}
					</span>
				</span>
				<ChevronRight className="size-4 shrink-0 text-fg-dim" aria-hidden />
			</Link>

			{me.societies.length > 0 && (
				<MeSection title="Your societies">
					<ul className="divide-y divide-hairline">
						{me.societies.map((society) => (
							<li key={society.id}>
								<Link
									href={`/societies/${society.id}`}
									className="flex min-h-14 items-center justify-between gap-3 px-4"
								>
									<span className="min-w-0">
										<span className="block truncate text-body text-fg">
											{society.name}
										</span>
										<span className="text-caption capitalize text-fg-dim">
											{society.role.toLowerCase().replace(/_/g, " ")}
										</span>
									</span>
									<ChevronRight
										className="size-4 shrink-0 text-fg-dim"
										aria-hidden
									/>
								</Link>
							</li>
						))}
					</ul>
				</MeSection>
			)}

			{me.intentions.length > 0 && (
				<MeSection title="Your Mass intentions">
					<ul className="divide-y divide-hairline">
						{me.intentions.map((intention) => (
							<li key={intention.id} className="px-4 py-3">
								<p className="font-plex-serif text-body text-fg-body">
									{intention.intention}
								</p>
								<p className="mt-1 text-caption text-fg-dim">
									{new Intl.DateTimeFormat("en-NG", {
										day: "numeric",
										month: "long",
									}).format(intention.date)}{" "}
									· {intention.status.toLowerCase()}
								</p>
							</li>
						))}
					</ul>
				</MeSection>
			)}

			{me.appointments.length > 0 && (
				<MeSection title="Your appointments">
					<ul className="divide-y divide-hairline">
						{me.appointments.map((appointment) => (
							<li key={appointment.id} className="px-4 py-3">
								<p className="text-body text-fg">{appointment.purpose}</p>
								<p className="mt-1 text-caption text-fg-dim">
									{new Intl.DateTimeFormat("en-NG", {
										day: "numeric",
										month: "long",
										hour: "numeric",
										minute: "2-digit",
									}).format(appointment.date)}{" "}
									· {appointment.status.toLowerCase()}
								</p>
							</li>
						))}
					</ul>
				</MeSection>
			)}

			<MeSection title="Account">
				<Link
					href="/me/security"
					className="flex min-h-14 items-center justify-between gap-3 px-4"
				>
					<span>
						<span className="block text-body text-fg">Security</span>
						<span className="mt-0.5 block text-caption text-fg-dim">
							Password, two-factor, how you sign in
						</span>
					</span>
					<ChevronRight className="size-4 shrink-0 text-fg-dim" aria-hidden />
				</Link>
				<Link
					href="/me/devices"
					className="flex min-h-14 items-center justify-between gap-3 px-4"
				>
					<span className="text-body text-fg">Signed-in devices</span>
					<ChevronRight className="size-4 shrink-0 text-fg-dim" aria-hidden />
				</Link>
				<div className="flex items-center justify-between gap-3 px-4 py-3">
					<span className="text-body text-fg">Appearance</span>
					<ThemeToggle />
				</div>
			</MeSection>
		</FeedShell>
	);
}

function MeTopBar() {
	return (
		<div className="sticky top-0 z-30 border-b border-hairline bg-surface-1/95 px-4 py-3 backdrop-blur pt-[calc(12px+env(safe-area-inset-top))]">
			<h1 className="text-title font-semibold text-fg">Me</h1>
		</div>
	);
}

function MeSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-b border-hairline pb-1">
			<h2 className="px-4 pb-1 pt-4 font-plex-mono text-caption uppercase tracking-[0.1em] text-fg-dim">
				{title}
			</h2>
			{children}
		</section>
	);
}
